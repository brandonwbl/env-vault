import { VaultEntry } from '../crypto';

export interface MaskRule {
  key: string;
  pattern: string; // e.g. '****', 'first4', 'last4'
}

export function maskValue(value: string, pattern: string): string {
  if (pattern === '****') return '****';
  if (pattern === 'first4') {
    if (value.length <= 4) return '****';
    return value.slice(0, 4) + '*'.repeat(value.length - 4);
  }
  if (pattern === 'last4') {
    if (value.length <= 4) return '****';
    return '*'.repeat(value.length - 4) + value.slice(-4);
  }
  return '****';
}

export function applyMaskRules(
  entries: VaultEntry[],
  rules: MaskRule[]
): Array<{ key: string; value: string; masked: boolean }> {
  return entries.map((entry) => {
    const rule = rules.find((r) => r.key === entry.key);
    if (rule) {
      return { key: entry.key, value: maskValue(entry.value, rule.pattern), masked: true };
    }
    return { key: entry.key, value: entry.value, masked: false };
  });
}

export function formatMasked(
  results: Array<{ key: string; value: string; masked: boolean }>
): string {
  if (results.length === 0) return 'No entries.';
  return results
    .map((r) => `${r.key}=${r.value}${r.masked ? ' [masked]' : ''}`)
    .join('\n');
}
