import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createVault, serializeVault, writeVault } from '../crypto';
import { exportVault, exportToFile } from './export';
import { readFile } from 'fs/promises';

const TEST_PASSWORD = 'export-test-password';
const TEST_ENTRIES = { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret123' };

let tmpDir: string;
let tmpVaultPath: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'env-vault-export-'));
  tmpVaultPath = join(tmpDir, 'test.vault');
  const vault = await createVault(TEST_PASSWORD, TEST_ENTRIES);
  const serialized = await serializeVault(vault, TEST_PASSWORD);
  await writeVault(tmpVaultPath, serialized);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('exportVault', () => {
  it('exports all entries in dotenv format by default', async () => {
    const result = await exportVault({ vaultPath: tmpVaultPath, password: TEST_PASSWORD });
    expect(result).toContain('DB_HOST=localhost');
    expect(result).toContain('DB_PORT=5432');
    expect(result).toContain('API_KEY=secret123');
  });

  it('exports all entries in json format', async () => {
    const result = await exportVault({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, format: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(TEST_ENTRIES);
  });

  it('exports only specified keys', async () => {
    const result = await exportVault({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, keys: ['DB_HOST'] });
    expect(result).toContain('DB_HOST=localhost');
    expect(result).not.toContain('API_KEY');
  });

  it('throws when requested key does not exist', async () => {
    await expect(
      exportVault({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, keys: ['MISSING_KEY'] })
    ).rejects.toThrow('Keys not found in vault: MISSING_KEY');
  });

  it('throws on wrong password', async () => {
    await expect(
      exportVault({ vaultPath: tmpVaultPath, password: 'wrong-password' })
    ).rejects.toThrow();
  });
});

describe('exportToFile', () => {
  it('writes exported content to a file', async () => {
    const outputPath = join(tmpDir, '.env');
    await exportToFile({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, outputPath });
    const content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('DB_HOST=localhost');
  });
});
