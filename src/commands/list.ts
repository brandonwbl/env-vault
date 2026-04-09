import { readVault, deserializeVault } from '../crypto';
import { parseEnv } from '../env';

export interface ListOptions {
  vaultPath: string;
  password: string;
  showValues?: boolean;
}

export interface ListResult {
  keys: string[];
  entries: Record<string, string>;
}

export async function listCommand(options: ListOptions): Promise<ListResult> {
  const { vaultPath, password, showValues = false } = options;

  const raw = await readVault(vaultPath);
  const vault = deserializeVault(raw);

  if (!vault.encrypted) {
    throw new Error('Vault is missing encrypted content');
  }

  const { decrypt, deriveKey } = await import('../crypto');
  const key = await deriveKey(password, vault.salt);
  const decrypted = await decrypt(vault.encrypted, key, vault.iv);

  const entries = parseEnv(decrypted);
  const keys = Object.keys(entries);

  if (!showValues) {
    return { keys, entries: Object.fromEntries(keys.map((k) => [k, '***'])) };
  }

  return { keys, entries };
}

export function formatList(result: ListResult, showValues: boolean): string {
  if (result.keys.length === 0) {
    return 'No environment variables found in vault.';
  }

  const lines = result.keys.map((key) => {
    const value = showValues ? result.entries[key] : '***';
    return `${key}=${value}`;
  });

  return lines.join('\n');
}
