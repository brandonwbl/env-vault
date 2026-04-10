import { readVault, deserializeVault } from '../crypto';
import { serializeEnv } from '../env';

export interface ExportOptions {
  vaultPath: string;
  password: string;
  format?: 'dotenv' | 'json';
  keys?: string[];
}

export async function exportVault(options: ExportOptions): Promise<string> {
  const { vaultPath, password, format = 'dotenv', keys } = options;

  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);

  let entries = Object.entries(vault.entries);

  if (keys && keys.length > 0) {
    entries = entries.filter(([key]) => keys.includes(key));
    const missing = keys.filter((k) => !vault.entries[k]);
    if (missing.length > 0) {
      throw new Error(`Keys not found in vault: ${missing.join(', ')}`);
    }
  }

  const filtered = Object.fromEntries(entries);

  if (format === 'json') {
    return JSON.stringify(filtered, null, 2);
  }

  return serializeEnv(filtered);
}

export async function exportToFile(
  options: ExportOptions & { outputPath: string }
): Promise<void> {
  const { outputPath, ...rest } = options;
  const fs = await import('fs/promises');
  const content = await exportVault(rest);
  await fs.writeFile(outputPath, content, 'utf-8');
}
