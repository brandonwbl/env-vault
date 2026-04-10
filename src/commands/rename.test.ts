import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createVault, serializeVault, writeVault, readVault, deserializeVault } from '../crypto';
import { renameVariable } from './rename';

const PASSWORD = 'rename-test-pass';
let tmpDir: string;
let tmpVaultPath: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-vault-rename-'));
  tmpVaultPath = path.join(tmpDir, 'test.vault');
  const vault = await createVault({ FOO: 'bar', BAZ: 'qux' }, PASSWORD);
  const serialized = await serializeVault(vault, PASSWORD);
  await writeVault(tmpVaultPath, serialized);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('renameVariable', () => {
  it('renames an existing key', async () => {
    await renameVariable(tmpVaultPath, 'FOO', 'FOO_RENAMED', PASSWORD);
    const raw = await readVault(tmpVaultPath);
    const vault = await deserializeVault(raw, PASSWORD);
    expect(vault.variables['FOO_RENAMED']).toBe('bar');
    expect(vault.variables['FOO']).toBeUndefined();
  });

  it('preserves other keys after rename', async () => {
    await renameVariable(tmpVaultPath, 'FOO', 'FOO2', PASSWORD);
    const raw = await readVault(tmpVaultPath);
    const vault = await deserializeVault(raw, PASSWORD);
    expect(vault.variables['BAZ']).toBe('qux');
  });

  it('throws if old key does not exist', async () => {
    await expect(
      renameVariable(tmpVaultPath, 'MISSING', 'NEW_KEY', PASSWORD)
    ).rejects.toThrow('Key "MISSING" not found in vault.');
  });

  it('throws if new key already exists', async () => {
    await expect(
      renameVariable(tmpVaultPath, 'FOO', 'BAZ', PASSWORD)
    ).rejects.toThrow('Key "BAZ" already exists in vault.');
  });

  it('throws if old and new keys are the same', async () => {
    await expect(
      renameVariable(tmpVaultPath, 'FOO', 'FOO', PASSWORD)
    ).rejects.toThrow('Old and new key names must be different.');
  });

  it('throws if keys are empty strings', async () => {
    await expect(
      renameVariable(tmpVaultPath, '', 'NEW', PASSWORD)
    ).rejects.toThrow('Both old and new key names are required.');
  });
});
