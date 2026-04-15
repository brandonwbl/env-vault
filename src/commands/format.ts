import { VaultEntry } from '../crypto';

export type FormatStyle = 'dotenv' | 'json' | 'yaml' | 'export';

export function formatEntries(entries: VaultEntry[], style: FormatStyle): string {
  switch (style) {
    case 'dotenv':
      return formatDotenv(entries);
    case 'json':
      return formatJson(entries);
    case 'yaml':
      return formatYaml(entries);
    case 'export':
      return formatExport(entries);
    default:
      throw new Error(`Unknown format style: ${style}`);
  }
}

function formatDotenv(entries: VaultEntry[]): string {
  return entries
    .map(({ key, value }) => {
      const escaped = value.includes('\n') || value.includes('"')
        ? `"${value.replace(/"/g, '\\"')}"`
        : value;
      return `${key}=${escaped}`;
    })
    .join('\n');
}

function formatJson(entries: VaultEntry[]): string {
  const obj: Record<string, string> = {};
  for (const { key, value } of entries) {
    obj[key] = value;
  }
  return JSON.stringify(obj, null, 2);
}

function formatYaml(entries: VaultEntry[]): string {
  return entries
    .map(({ key, value }) => {
      const needsQuotes = /[:\#\[\]{}|>&*!,]/.test(value) || value.includes('\n');
      const formatted = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}: ${formatted}`;
    })
    .join('\n');
}

function formatExport(entries: VaultEntry[]): string {
  return entries
    .map(({ key, value }) => {
      const escaped = `"${value.replace(/"/g, '\\"')}"`;
      return `export ${key}=${escaped}`;
    })
    .join('\n');
}

export async function runFormat(
  vaultPath: string,
  password: string,
  style: FormatStyle
): Promise<string> {
  const { readVault, deserializeVault } = await import('../crypto');
  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);
  return formatEntries(vault.entries, style);
}
