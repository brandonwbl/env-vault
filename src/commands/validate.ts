import { readVault } from '../crypto/vault';
import { VaultEntry } from '../crypto/vault';

export interface ValidationRule {
  name: string;
  test: (entry: VaultEntry) => boolean;
  message: string;
}

export interface ValidationResult {
  key: string;
  rule: string;
  message: string;
}

const defaultRules: ValidationRule[] = [
  {
    name: 'no-empty-value',
    test: (e) => e.value.trim().length > 0,
    message: 'Value must not be empty or whitespace',
  },
  {
    name: 'valid-key-format',
    test: (e) => /^[A-Z][A-Z0-9_]*$/.test(e.key),
    message: 'Key must be uppercase letters, digits, or underscores, starting with a letter',
  },
  {
    name: 'no-whitespace-in-key',
    test: (e) => !/\s/.test(e.key),
    message: 'Key must not contain whitespace',
  },
  {
    name: 'reasonable-value-length',
    test: (e) => e.value.length <= 4096,
    message: 'Value exceeds maximum allowed length of 4096 characters',
  },
];

export function validateEntries(
  entries: VaultEntry[],
  rules: ValidationRule[] = defaultRules
): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const entry of entries) {
    for (const rule of rules) {
      if (!rule.test(entry)) {
        results.push({ key: entry.key, rule: rule.name, message: rule.message });
      }
    }
  }
  return results;
}

export function formatValidateResult(results: ValidationResult[]): string {
  if (results.length === 0) return '✔ All entries are valid.';
  const lines = results.map(
    (r) => `  ✖ [${r.key}] (${r.rule}): ${r.message}`
  );
  return `Found ${results.length} validation issue(s):\n${lines.join('\n')}`;
}

export async function runValidate(
  vaultPath: string,
  password: string
): Promise<void> {
  const vault = await readVault(vaultPath, password);
  const results = validateEntries(vault.entries);
  console.log(formatValidateResult(results));
  if (results.length > 0) process.exit(1);
}
