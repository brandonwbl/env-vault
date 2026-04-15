import { readVault, writeVault, createVault, serializeVault, deserializeVault } from '../crypto';
import { deriveKey, decrypt, encrypt } from '../crypto';

interface RotateOptions {
  vaultPath: string;
  oldPassword: string;
  newPassword: string;
}

export async function rotate(options: RotateOptions): Promise<void> {
  const { vaultPath, oldPassword, newPassword } = options;

  if (!oldPassword) {
    throw new Error('Old password must not be empty');
  }

  if (!newPassword) {
    throw new Error('New password must not be empty');
  }

  if (oldPassword === newPassword) {
    throw new Error('New password must differ from the old password');
  }

  // Read and deserialize the existing vault
  const rawVault = await readVault(vaultPath);
  const vault = deserializeVault(rawVault);

  // Derive old key and decrypt the vault data
  const oldKey = await deriveKey(oldPassword, vault.salt);
  let decryptedData: string;

  try {
    decryptedData = await decrypt(vault.data, oldKey, vault.iv);
  } catch {
    throw new Error('Failed to decrypt vault: invalid password');
  }

  // Generate new salt and derive new key
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const newKey = await deriveKey(newPassword, newSalt);

  // Re-encrypt with new key
  const { ciphertext, iv } = await encrypt(decryptedData, newKey);

  // Build updated vault with new credentials
  const updatedVault = createVault({
    data: ciphertext,
    iv,
    salt: newSalt,
    createdAt: vault.createdAt,
    updatedAt: new Date().toISOString(),
  });

  const serialized = serializeVault(updatedVault);
  await writeVault(vaultPath, serialized);

  console.log('Vault password rotated successfully.');
}
