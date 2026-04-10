import { readVault, writeVault } from '../crypto/vault';
import { deriveKey } from '../crypto/encryption';

interface CopyOptions {
  sourceVault: string;
  destVault: string;
  password: string;
  destPassword?: string;
  keys?: string[];
  overwrite?: boolean;
}

export async function copy(options: CopyOptions): Promise<void> {
  const {
    sourceVault,
    destVault,
    password,
    destPassword,
    keys,
    overwrite = false,
  } = options;

  const sourceKey = await deriveKey(password);
  const vault = await readVault(sourceVault, sourceKey);

  const targetKey = destPassword
    ? await deriveKey(destPassword)
    : sourceKey;

  let targetVault: Record<string, string>;
  try {
    targetVault = await readVault(destVault, targetKey);
  } catch {
    targetVault = {};
  }

  const entries = keys && keys.length > 0
    ? Object.entries(vault).filter(([k]) => keys.includes(k))
    : Object.entries(vault);

  if (entries.length === 0) {
    throw new Error('No matching keys found in source vault.');
  }

  const skipped: string[] = [];
  const copied: string[] = [];

  for (const [key, value] of entries) {
    if (!overwrite && key in targetVault) {
      skipped.push(key);
      continue;
    }
    targetVault[key] = value;
    copied.push(key);
  }

  await writeVault(destVault, targetVault, targetKey);

  if (copied.length > 0) {
    console.log(`Copied ${copied.length} key(s): ${copied.join(', ')}`);
  }
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} existing key(s): ${skipped.join(', ')} (use --overwrite to replace)`);
  }
}
