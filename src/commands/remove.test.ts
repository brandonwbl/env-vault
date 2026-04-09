import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { removeCommand } from './remove';
import { addCommand } from './add';
import { getCommand } from './get';
import { createVault, serializeVault, writeVault } from '../crypto';

let tmpDir: string;
let tmpVaultPath: string;
const TEST_PASSWORD = 'test-password-123';

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'env-vault-remove-test-'));
  tmpVaultPath = join(tmpDir, 'test.vault');

  const vault = await createVault(TEST_PASSWORD, '');
  await writeVault(tmpVaultPath, serializeVault(vault));

  await addCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO', value: 'bar' });
  await addCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'KEEP', value: 'me' });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('removeCommand', () => {
  it('removes an existing key', async () => {
    const result = await removeCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO' });
    expect(result.removed).toBe(true);
    expect(result.key).toBe('FOO');
  });

  it('key no longer retrievable after removal', async () => {
    await removeCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO' });
    await expect(
      getCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO' })
    ).rejects.toThrow();
  });

  it('does not affect other keys', async () => {
    await removeCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO' });
    const result = await getCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'KEEP' });
    expect(result).toBe('me');
  });

  it('returns removed=false for non-existent key', async () => {
    const result = await removeCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'NONEXISTENT' });
    expect(result.removed).toBe(false);
  });

  it('throws on wrong password', async () => {
    await expect(
      removeCommand({ vaultPath: tmpVaultPath, password: 'wrong', key: 'FOO' })
    ).rejects.toThrow();
  });
});
