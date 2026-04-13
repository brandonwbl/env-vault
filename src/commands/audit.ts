import { readVault } from '../crypto/vault';
import { VaultEntry } from '../crypto';

export interface AuditIssue {
  key: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export function auditEntries(entries: Record<string, VaultEntry>): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const [key, entry] of Object.entries(entries)) {
    const value = entry.value;

    // Check for empty values
    if (!value || value.trim() === '') {
      issues.push({ key, severity: 'medium', message: 'Value is empty or blank' });
      continue;
    }

    // Check for placeholder values
    if (/^(todo|fixme|placeholder|changeme|replace_?me|your[_-]?.*here)$/i.test(value)) {
      issues.push({ key, severity: 'high', message: 'Value appears to be a placeholder' });
    }

    // Check for potentially exposed secrets in non-secret keys
    if (!/secret|token|key|pass|pwd|auth|cred/i.test(key) && value.length > 80) {
      issues.push({ key, severity: 'low', message: 'Unusually long value for a non-secret key' });
    }

    // Check for keys with default/insecure patterns
    if (/^(admin|root|test|dev|debug|localhost|127\.0\.0\.1)$/i.test(value)) {
      issues.push({ key, severity: 'medium', message: 'Value looks like a default or insecure setting' });
    }

    // Check for keys that look like secrets but have short values
    if (/secret|token|key|password/i.test(key) && value.length < 8) {
      issues.push({ key, severity: 'high', message: 'Secret value is suspiciously short' });
    }
  }

  return issues;
}

export function formatAuditResult(issues: AuditIssue[]): string {
  if (issues.length === 0) return '✅ No issues found.';

  const grouped = { high: [] as AuditIssue[], medium: [] as AuditIssue[], low: [] as AuditIssue[] };
  for (const issue of issues) grouped[issue.severity].push(issue);

  const lines: string[] = [`Found ${issues.length} issue(s):\n`];
  const icons = { high: '🔴', medium: '🟡', low: '🔵' };

  for (const sev of ['high', 'medium', 'low'] as const) {
    for (const issue of grouped[sev]) {
      lines.push(`  ${icons[sev]} [${sev.toUpperCase()}] ${issue.key}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export async function runAudit(vaultPath: string, password: string): Promise<void> {
  const vault = await readVault(vaultPath, password);
  const issues = auditEntries(vault.entries);
  console.log(formatAuditResult(issues));
}
