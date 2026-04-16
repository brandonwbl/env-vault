import { VaultEntry } from '../crypto';

export type TransformOp = 'uppercase' | 'lowercase' | 'trim' | 'base64encode' | 'base64decode' | 'prefix' | 'suffix';

export interface TransformRule {
  op: TransformOp;
  arg?: string;
}

export function applyTransform(value: string, rule: TransformRule): string {
  switch (rule.op) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'trim':
      return value.trim();
    case 'base64encode':
      return Buffer.from(value).toString('base64');
    case 'base64decode':
      return Buffer.from(value, 'base64').toString('utf8');
    case 'prefix':
      return `${rule.arg ?? ''}${value}`;
    case 'suffix':
      return `${value}${rule.arg ?? ''}`;
    default:
      return value;
  }
}

export function transformEntries(
  entries: VaultEntry[],
  keys: string[],
  rules: TransformRule[]
): { entries: VaultEntry[]; changed: string[] } {
  const keySet = new Set(keys);
  const changed: string[] = [];
  const result = entries.map((entry) => {
    if (!keySet.has(entry.key)) return entry;
    let newValue = entry.value;
    for (const rule of rules) {
      newValue = applyTransform(newValue, rule);
    }
    if (newValue !== entry.value) {
      changed.push(entry.key);
      return { ...entry, value: newValue };
    }
    return entry;
  });
  return { entries: result, changed };
}

export function formatTransformResult(changed: string[], total: number): string {
  if (changed.length === 0) return 'No entries were modified.';
  const lines = [`Transformed ${changed.length}/${total} entries:`];
  for (const key of changed) lines.push(`  • ${key}`);
  return lines.join('\n');
}
