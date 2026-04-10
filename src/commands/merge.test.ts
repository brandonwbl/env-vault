import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { merge } from './merge';
import { writeVault, readVault } from '../crypto/vault';
import { deriveKey } from '../crypto/encryption';

const tmpDir = os.tmpdir();
const vault1Path = path.join(tmpDir, 'merge-v1-test.vault');
const vault2Path = path.join(tmpDir, 'merge-v2-test.vault');
const vault3Path = path.join(tmpDir, 'merge-v3-test.vault');
const outputPath = path.join(tmpDir, 'merge-out-test.vault');
const password = 'merge-test-password';

beforeEach(async () => {
  const key = await deriveKey(password);
  await writeVault(vault1Path, { API_KEY: 'key-from-v1', SHARED: 'v1-value' }, key);
  await writeVault(vault2Path, { DB_URL: 'postgres://v2', SHARED: 'v2-value' }, key);
  await writeVault(vault3Path, { EXTRA: 'extra-val' }, key);
});

afterEach(() => {
  [vault1Path, vault2Path, vault3Path, outputPath].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

describe('merge command', () => {
  it('merges two vaults with last-wins strategy', async () => {
    await merge({ vaults: [vault1Path, vault2Path], outputVault: outputPath, password });
    const key = await deriveKey(password);
    const result = await readVault(outputPath, key);
    expect(result.API_KEY).toBe('key-from-v1');
    expect(result.DB_URL).toBe('postgres://v2');
    expect(result.SHARED).toBe('v2-value');
  });

  it('merges two vaults with first-wins strategy', async () => {
    await merge({ vaults: [vault1Path, vault2Path], outputVault: outputPath, password, strategy: 'first-wins' });
    const key = await deriveKey(password);
    const result = await readVault(outputPath, key);
    expect(result.SHARED).toBe('v1-value');
  });

  it('merges three vaults', async () => {
    await merge({ vaults: [vault1Path, vault2Path, vault3Path], outputVault: outputPath, password });
    const key = await deriveKey(password);
    const result = await readVault(outputPath, key);
    expect(Object.keys(result)).toHaveLength(4);
    expect(result.EXTRA).toBe('extra-val');
  });

  it('throws when fewer than two vaults are provided', async () => {
    await expect(
      merge({ vaults: [vault1Path], outputVault: outputPath, password })
    ).rejects.toThrow('At least two source vaults are required for merging.');
  });

  it('supports a separate output password', async () => {
    const outputPassword = 'output-secret';
    await merge({ vaults: [vault1Path, vault2Path], outputVault: outputPath, password, outputPassword });
    const outKey = await deriveKey(outputPassword);
    const result = await readVault(outputPath, outKey);
    expect(result.API_KEY).toBe('key-from-v1');
  });
});
