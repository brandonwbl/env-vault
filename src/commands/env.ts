import { readVault, writeVault } from '../crypto';
import { serializeEnv } from '../env';

export interface EnvOptions {
  vaultPath: string;
  password: string;
  format?: 'export' | 'raw' | 'json';
  filter?: string;
}

export async function envCommand(options: EnvOptions): Promise<string> {
  const { vaultPath, password, format = 'export', filter } = options;

  const vault = await readVault(vaultPath, password);
  let entries = Object.entries(vault.data);

  if (filter) {
    const pattern = new RegExp(filter, 'i');
    entries = entries.filter(([key]) => pattern.test(key));
  }

  if (entries.length === 0) {
    return '';
  }

  const filtered = Object.fromEntries(entries);

  if (format === 'json') {
    return JSON.stringify(filtered, null, 2);
  }

  if (format === 'raw') {
    return serializeEnv(filtered);
  }

  // export format: prefix each line with `export `
  return serializeEnv(filtered)
    .split('\n')
    .filter(Boolean)
    .map((line) => `export ${line}`)
    .join('\n');
}

export async function envSetCommand(
  key: string,
  value: string,
  options: { vaultPath: string; password: string }
): Promise<void> {
  const { vaultPath, password } = options;
  const vault = await readVault(vaultPath, password);
  vault.data[key] = value;
  vault.updatedAt = new Date().toISOString();
  await writeVault(vaultPath, password, vault);
}

export async function envUnsetCommand(
  key: string,
  options: { vaultPath: string; password: string }
): Promise<void> {
  const { vaultPath, password } = options;
  const vault = await readVault(vaultPath, password);
  if (!(key in vault.data)) {
    throw new Error(`Key "${key}" not found in vault`);
  }
  delete vault.data[key];
  vault.updatedAt = new Date().toISOString();
  await writeVault(vaultPath, password, vault);
}
