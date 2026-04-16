import * as fs from 'fs';
import * as path from 'path';

export interface PolicyRule {
  pattern: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowedEnvs?: string[];
}

export interface Policy {
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

export function getPolicyPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.env-vault-policy.json');
}

export function loadPolicy(vaultPath: string): Policy {
  const p = getPolicyPath(vaultPath);
  if (!fs.existsSync(p)) return { rules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function savePolicy(vaultPath: string, policy: Policy): void {
  fs.writeFileSync(getPolicyPath(vaultPath), JSON.stringify(policy, null, 2));
}

export function addRule(vaultPath: string, rule: PolicyRule): Policy {
  const policy = loadPolicy(vaultPath);
  policy.rules = policy.rules.filter(r => r.pattern !== rule.pattern);
  policy.rules.push(rule);
  policy.updatedAt = new Date().toISOString();
  savePolicy(vaultPath, policy);
  return policy;
}

export function removeRule(vaultPath: string, pattern: string): Policy {
  const policy = loadPolicy(vaultPath);
  policy.rules = policy.rules.filter(r => r.pattern !== pattern);
  policy.updatedAt = new Date().toISOString();
  savePolicy(vaultPath, policy);
  return policy;
}

export interface PolicyViolation {
  key: string;
  rule: PolicyRule;
  reason: string;
}

export function enforcePolicy(entries: Record<string, string>, policy: Policy): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  for (const rule of policy.rules) {
    const regex = new RegExp(rule.pattern);
    const matching = Object.entries(entries).filter(([k]) => regex.test(k));
    if (rule.required && matching.length === 0) {
      violations.push({ key: rule.pattern, rule, reason: `No key matching '${rule.pattern}' found (required)` });
    }
    for (const [key, value] of matching) {
      if (rule.minLength !== undefined && value.length < rule.minLength)
        violations.push({ key, rule, reason: `Value too short (min ${rule.minLength})` });
      if (rule.maxLength !== undefined && value.length > rule.maxLength)
        violations.push({ key, rule, reason: `Value too long (max ${rule.maxLength})` });
    }
  }
  return violations;
}

export function formatPolicyViolations(violations: PolicyViolation[]): string {
  if (violations.length === 0) return 'No policy violations found.';
  return violations.map(v => `[VIOLATION] ${v.key}: ${v.reason}`).join('\n');
}
