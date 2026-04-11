import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { clone } from './clone';
import { createVault, writeVault, serializeVault, readVault, deserializeVault } from '../crypto';

let tmpDir: string;
let sourcePath: string;
let destPath: string;
const password = 'test-password-123';

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'env-vault-clone-'));
  sourcePath = join(tmpDir, 'source.vault');
  destPath = join(tmpDir, 'dest.vault');

  const vault = createVault({ API_KEY: 'abc123', DB_URL: 'postgres://localhost' });
  const serialized = await serializeVault(vault, password);
  await writeVault(sourcePath, serialized);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('clone', () => {
  it('clones all entries from source to a new dest vault', async () => {
    await clone({ sourcePath, destPath, sourcePassword: password });

    const raw = await readVault(destPath);
    const vault = await deserializeVault(raw, password);

    expect(vault.entries).toMatchObject({ API_KEY: 'abc123', DB_URL: 'postgres://localhost' });
  });

  it('clones only specified keys', async () => {
    await clone({ sourcePath, destPath, sourcePassword: password, keys: ['API_KEY'] });

    const raw = await readVault(destPath);
    const vault = await deserializeVault(raw, password);

    expect(vault.entries).toMatchObject({ API_KEY: 'abc123' });
    expect(vault.entries).not.toHaveProperty('DB_URL');
  });

  it('throws if a specified key does not exist in source', async () => {
    await expect(
      clone({ sourcePath, destPath, sourcePassword: password, keys: ['MISSING_KEY'] })
    ).rejects.toThrow('Key "MISSING_KEY" not found in source vault');
  });

  it('merges into existing dest vault without overwriting unrelated keys', async () => {
    const destVault = createVault({ EXISTING_KEY: 'existing' });
    const destSerialized = await serializeVault(destVault, password);
    await writeVault(destPath, destSerialized);

    await clone({ sourcePath, destPath, sourcePassword: password, keys: ['API_KEY'] });

    const raw = await readVault(destPath);
    const vault = await deserializeVault(raw, password);

    expect(vault.entries).toMatchObject({ EXISTING_KEY: 'existing', API_KEY: 'abc123' });
  });

  it('supports a different password for the destination vault', async () => {
    const newPassword = 'new-dest-password';
    await clone({ sourcePath, destPath, sourcePassword: password, destPassword: newPassword });

    const raw = await readVault(destPath);
    const vault = await deserializeVault(raw, newPassword);

    expect(vault.entries).toMatchObject({ API_KEY: 'abc123' });
  });
});
