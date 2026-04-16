import { VaultEntry } from '../crypto';

export interface RedactRule {
  key?: string;
  pattern?: string;
  replacement: string;
}

export interface RedactResult {
  key: string;
  original: string;
  redacted: string;
  changed: boolean;
}

export function applyRedact(value: string, rules: RedactRule[]): string {
  let result = value;
  for (const rule of rules) {
    if (rule.pattern) {
      const re = new RegExp(rule.pattern, 'g');
      result = result.replace(re, rule.replacement);
    }
  }
  return result;
}

export function redactEntries(
  entries: VaultEntry[],
  rules: RedactRule[]
): RedactResult[] {
  return entries.map((entry) => {
    const matchingRules = rules.filter(
      (r) => !r.key || r.key === entry.key
    );
    const redacted = applyRedact(entry.value, matchingRules);
    return {
      key: entry.key,
      original: entry.value,
      redacted,
      changed: redacted !== entry.value,
    };
  });
}

export function formatRedactResult(results: RedactResult[]): string {
  const changed = results.filter((r) => r.changed);
  if (changed.length === 0) return 'No values were redacted.';
  const lines = changed.map(
    (r) => `  ${r.key}: "${r.original}" → "${r.redacted}"`
  );
  return `Redacted ${changed.length} value(s):\n${lines.join('\n')}`;
}
