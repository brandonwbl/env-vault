import * as path from 'path';
import { readVault, writeVault, createVault } from '../crypto';
import { parseEnv } from '../env';

export interface AddOptions {
  vaultPath: string;
  password: string;
  key: string;
  value: string;
}

export async function addSecret(options: AddOptions): Promise<void> {
  const { vaultPath, password, key, value } = options;

  if (!key || key.trim() === '') {
    throw new Error('Key must not be empty');
  }

  if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    throw new Error(`Invalid key format: "${key}". Keys must match /^[A-Z_][A-Z0-9_]*/i`);
  }

  let vault;

  try {
    vault = await readVault(vaultPath, password);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      vault = createVault();
    } else {
      throw err;
    }
  }

  const existing = vault.secrets[key];
  vault.secrets[key] = value;
  vault.updatedAt = new Date().toISOString();

  await writeVault(vaultPath, password, vault);

  if (existing !== undefined) {
    console.log(`Updated secret: ${key}`);
  } else {
    console.log(`Added secret: ${key}`);
  }
}

export async function addSecretsFromEnvString(
  envString: string,
  vaultPath: string,
  password: string
): Promise<void> {
  const parsed = parseEnv(envString);
  const keys = Object.keys(parsed);

  if (keys.length === 0) {
    console.log('No secrets found in input.');
    return;
  }

  for (const key of keys) {
    await addSecret({ vaultPath, password, key, value: parsed[key] });
  }

  console.log(`Imported ${keys.length} secret(s) from env string.`);
}
