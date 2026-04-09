import { readVault, deserializeVault } from '../crypto';
import { parseEnv } from '../env';

export interface GetOptions {
  vaultPath: string;
  password: string;
  key: string;
  json?: boolean;
}

export async function getCommand(options: GetOptions): Promise<string | undefined> {
  const { vaultPath, password, key, json } = options;

  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);
  const entries = parseEnv(vault.plaintext);

  const entry = entries.find((e) => e.key === key);

  if (!entry) {
    if (json) {
      process.stdout.write(JSON.stringify({ error: `Key "${key}" not found` }) + '\n');
    } else {
      process.stderr.write(`Key "${key}" not found in vault.\n`);
    }
    return undefined;
  }

  if (json) {
    process.stdout.write(JSON.stringify({ key: entry.key, value: entry.value }) + '\n');
  } else {
    process.stdout.write(`${entry.key}=${entry.value}\n`);
  }

  return entry.value;
}

export async function listCommand(options: Omit<GetOptions, 'key'>): Promise<string[]> {
  const { vaultPath, password, json } = options;

  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);
  const entries = parseEnv(vault.plaintext);

  const keys = entries.map((e) => e.key);

  if (json) {
    process.stdout.write(JSON.stringify(entries.map((e) => ({ key: e.key, value: e.value }))) + '\n');
  } else {
    entries.forEach((e) => process.stdout.write(`${e.key}=${e.value}\n`));
  }

  return keys;
}
