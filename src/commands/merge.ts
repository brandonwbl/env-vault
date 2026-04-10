import { readVault, writeVault } from '../crypto/vault';
import { deriveKey } from '../crypto/encryption';

interface MergeOptions {
  vaults: string[];
  outputVault: string;
  password: string;
  outputPassword?: string;
  strategy?: 'first-wins' | 'last-wins';
}

export async function merge(options: MergeOptions): Promise<void> {
  const { vaults, outputVault, password, outputPassword, strategy = 'last-wins' } = options;

  if (vaults.length < 2) {
    throw new Error('At least two source vaults are required for merging.');
  }

  const sourceKey = await deriveKey(password);
  const merged: Record<string, string> = {};
  const conflicts: Record<string, string[]> = {};

  for (const vaultPath of vaults) {
    const vault = await readVault(vaultPath, sourceKey);
    for (const [key, value] of Object.entries(vault)) {
      if (key in merged && merged[key] !== value) {
        if (!conflicts[key]) conflicts[key] = [merged[key]];
        conflicts[key].push(value);
      }
      if (strategy === 'last-wins' || !(key in merged)) {
        merged[key] = value;
      }
    }
  }

  const outputKey = outputPassword
    ? await deriveKey(outputPassword)
    : sourceKey;

  await writeVault(outputVault, merged, outputKey);

  console.log(`Merged ${vaults.length} vault(s) into ${outputVault}`);
  console.log(`Total keys: ${Object.keys(merged).length}`);

  if (Object.keys(conflicts).length > 0) {
    const conflictKeys = Object.keys(conflicts).join(', ');
    console.warn(`Conflicts resolved (${strategy}): ${conflictKeys}`);
  }
}
