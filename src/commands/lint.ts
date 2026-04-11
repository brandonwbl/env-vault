import { readVault } from '../crypto';

export interface LintIssue {
  key: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface LintResult {
  issues: LintIssue[];
  valid: boolean;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SENSITIVE_PATTERNS = /^(PASSWORD|SECRET|TOKEN|KEY|PRIVATE|CREDENTIAL)/i;
const EMPTY_VALUE_ALLOWED_KEYS = /^(OPTIONAL_|DEFAULT_)/i;

export function lintEntries(entries: Record<string, string>): LintResult {
  const issues: LintIssue[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (!KEY_PATTERN.test(key)) {
      issues.push({
        key,
        severity: 'error',
        message: `Key "${key}" must be uppercase with only letters, digits, and underscores`,
      });
    }

    if (value.trim() === '' && !EMPTY_VALUE_ALLOWED_KEYS.test(key)) {
      issues.push({
        key,
        severity: 'warning',
        message: `Key "${key}" has an empty value`,
      });
    }

    if (SENSITIVE_PATTERNS.test(key) && value.length < 8) {
      issues.push({
        key,
        severity: 'warning',
        message: `Key "${key}" looks sensitive but has a short value (possible placeholder)`,
      });
    }
  }

  return { issues, valid: issues.filter((i) => i.severity === 'error').length === 0 };
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) return '✓ No issues found.';
  return result.issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.key}: ${i.message}`)
    .join('\n');
}

export async function lintCommand(vaultPath: string, password: string): Promise<LintResult> {
  const vault = await readVault(vaultPath, password);
  return lintEntries(vault.entries);
}
