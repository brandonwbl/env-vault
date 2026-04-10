import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { rotate } from './rotate';
import { createVault, serializeVault, writeVault, readVault, deserializeVault } from '../crypto';
import { deriveKey, encrypt, decrypt } from '../crypto';

const tmpVaultPath = path.join(os.tmpdir(), `rotate-test-vault-${Date.now()}.vault`);

async function createTestVault(password: string, data: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const { ciphertext, iv } = await encrypt(data, key);
  const vault = createVault({
    data: ciphertext,
    iv,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await writeVault(tmpVaultPath, serializeVault(vault));
}

describe('rotate', () => {
  const oldPassword = 'old-secret-password';
  const newPassword = 'new-secret-password';
  const plaintext = 'API_KEY=abc123\nDB_URL=postgres://localhost/db';

  beforeEach(async () => {
    await createTestVault(oldPassword, plaintext);
  });

  afterEach(async () => {
    await fs.rm(tmpVaultPath, { force: true });
  });

  it('should re-encrypt vault with new password', async () => {
    await rotate({ vaultPath: tmpVaultPath, oldPassword, newPassword });

    const raw = await readVault(tmpVaultPath);
    const vault = deserializeVault(raw);
    const newKey = await deriveKey(newPassword, vault.salt);
    const decrypted = await decrypt(vault.data, newKey, vault.iv);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail decryption with old password after rotation', async () => {
    await rotate({ vaultPath: tmpVaultPath, oldPassword, newPassword });

    const raw = await readVault(tmpVaultPath);
    const vault = deserializeVault(raw);
    const oldKey = await deriveKey(oldPassword, vault.salt);

    await expect(decrypt(vault.data, oldKey, vault.iv)).rejects.toThrow();
  });

  it('should throw if old password is incorrect', async () => {
    await expect(
      rotate({ vaultPath: tmpVaultPath, oldPassword: 'wrong-password', newPassword })
    ).rejects.toThrow('Failed to decrypt vault: invalid password');
  });

  it('should update the updatedAt timestamp', async () => {
    const before = Date.now();
    await rotate({ vaultPath: tmpVaultPath, oldPassword, newPassword });

    const raw = await readVault(tmpVaultPath);
    const vault = deserializeVault(raw);
    const updatedAt = new Date(vault.updatedAt).getTime();

    expect(updatedAt).toBeGreaterThanOrEqual(before);
  });
});
