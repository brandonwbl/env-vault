import { readVault, deserializeVault, serializeVault, writeVault } from '../crypto';

export async function renameVariable(
  vaultPath: string,
  oldKey: string,
  newKey: string,
  password: string
): Promise<void> {
  if (!oldKey || !newKey) {
    throw new Error('Both old and new key names are required.');
  }

  if (oldKey === newKey) {
    throw new Error('Old and new key names must be different.');
  }

  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);

  if (!(oldKey in vault.variables)) {
    throw new Error(`Key "${oldKey}" not found in vault.`);
  }

  if (newKey in vault.variables) {
    throw new Error(`Key "${newKey}" already exists in vault.`);
  }

  vault.variables[newKey] = vault.variables[oldKey];
  delete vault.variables[oldKey];

  const serialized = await serializeVault(vault, password);
  await writeVault(vaultPath, serialized);
}
