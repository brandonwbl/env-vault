import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { copy } from './copy';
import { writeVault, readVault } from '../crypto/vault';
import { deriveKey } from '../crypto/encryption';

const tmpDir = os.tmpdir();
const srcVaultPath = path.join(tmpDir, 'copy-src-test.vault');
const dstVaultPath = path.join(tmpDir, 'copy-dst-test.vault');
const password = 'copy-test-password';

beforeEach(async () => {
  const key = await deriveKey(password);
  await writeVault(srcVaultPath, { API_KEY: 'abc123', DB_URL: 'postgres://localhost', SECRET: 'shh' }, key);
});

afterEach(() => {
  [srcVaultPath, dstVaultPath].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

describe('copy command', () => {
  it('copies all keys to a new vault', async () => {
    await copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password });
    const key = await deriveKey(password);
    const result = await readVault(dstVaultPath, key);
    expect(result.API_KEY).toBe('abc123');
    expect(result.DB_URL).toBe('postgres://localhost');
    expect(result.SECRET).toBe('shh');
  });

  it('copies only specified keys', async () => {
    await copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password, keys: ['API_KEY'] });
    const key = await deriveKey(password);
    const result = await readVault(dstVaultPath, key);
    expect(result.API_KEY).toBe('abc123');
    expect(result.DB_URL).toBeUndefined();
  });

  it('skips existing keys without overwrite', async () => {
    const key = await deriveKey(password);
    await writeVault(dstVaultPath, { API_KEY: 'original' }, key);
    await copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password });
    const result = await readVault(dstVaultPath, key);
    expect(result.API_KEY).toBe('original');
    expect(result.DB_URL).toBe('postgres://localhost');
  });

  it('overwrites existing keys when overwrite is true', async () => {
    const key = await deriveKey(password);
    await writeVault(dstVaultPath, { API_KEY: 'original' }, key);
    await copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password, overwrite: true });
    const result = await readVault(dstVaultPath, key);
    expect(result.API_KEY).toBe('abc123');
  });

  it('throws when no matching keys found', async () => {
    await expect(
      copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password, keys: ['NONEXISTENT'] })
    ).rejects.toThrow('No matching keys found in source vault.');
  });

  it('supports different passwords for source and destination', async () => {
    const destPassword = 'different-password';
    await copy({ sourceVault: srcVaultPath, destVault: dstVaultPath, password, destPassword });
    const destKey = await deriveKey(destPassword);
    const result = await readVault(dstVaultPath, destKey);
    expect(result.API_KEY).toBe('abc123');
  });
});
