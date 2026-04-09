import { readVault, deserializeVault, serializeVault, writeVault, deriveKey, encrypt, decrypt } from '../crypto';
import { parseEnv, serializeEnv } from '../env';

export interface RemoveOptions {
  vaultPath: string;
  password: string;
  key: string;
}

export interface RemoveResult {
  removed: boolean;
  key: string;
}

export async function removeCommand(options: RemoveOptions): Promise<RemoveResult> {
  const { vaultPath, password, key } = options;

  const raw = await readVault(vaultPath);
  const vault = deserializeVault(raw);

  if (!vault.encrypted) {
    throw new Error('Vault is missing encrypted content');
  }

  const derivedKey = await deriveKey(password, vault.salt);
  const decrypted = await decrypt(vault.encrypted, derivedKey, vault.iv);

  const entries = parseEnv(decrypted);

  if (!(key in entries)) {
    return { removed: false, key };
  }

  delete entries[key];

  const updated = serializeEnv(entries);
  const { encrypted, iv } = await encrypt(updated, derivedKey);

  const updatedVault = { ...vault, encrypted, iv };
  await writeVault(vaultPath, serializeVault(updatedVault));

  return { removed: true, key };
}
