import { PolicyRule, PolicyViolation } from './policy';

export function ruleToString(rule: PolicyRule): string {
  const parts: string[] = [`pattern: ${rule.pattern}`];
  if (rule.required) parts.push('required');
  if (rule.minLength !== undefined) parts.push(`minLength: ${rule.minLength}`);
  if (rule.maxLength !== undefined) parts.push(`maxLength: ${rule.maxLength}`);
  if (rule.allowedEnvs && rule.allowedEnvs.length > 0) parts.push(`allowedEnvs: ${rule.allowedEnvs.join(', ')}`);
  return parts.join(' | ');
}

export function groupViolationsByKey(violations: PolicyViolation[]): Record<string, PolicyViolation[]> {
  return violations.reduce((acc, v) => {
    if (!acc[v.key]) acc[v.key] = [];
    acc[v.key].push(v);
    return acc;
  }, {} as Record<string, PolicyViolation[]>);
}

export function violationSummary(violations: PolicyViolation[]): string {
  if (violations.length === 0) return 'Policy check passed.';
  const grouped = groupViolationsByKey(violations);
  const keys = Object.keys(grouped);
  return `Policy check failed: ${violations.length} violation(s) across ${keys.length} key(s).`;
}

export function mergeRules(existing: PolicyRule[], incoming: PolicyRule[]): PolicyRule[] {
  const map = new Map<string, PolicyRule>();
  for (const r of existing) map.set(r.pattern, r);
  for (const r of incoming) map.set(r.pattern, r);
  return Array.from(map.values());
}
