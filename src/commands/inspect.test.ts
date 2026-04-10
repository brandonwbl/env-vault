import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createVault, writeVault, serializeVault } from '../crypto';
import { inspectVault, formatInspect } from './inspect';

let tmpDir: string;
let tmpVaultPath: string;
const password = 'inspect-test-password';

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'env-vault-inspect-'));
  tmpVaultPath = join(tmpDir, 'test.vault');

  const vault = await createVault(password);
  vault.data['API_KEY'] = 'abc123';
  vault.data['DB_URL'] = 'postgres://localhost/test';
  const serialized = await serializeVault(vault, password);
  await writeVault(tmpVaultPath, serialized);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('inspectVault', () => {
  it('returns correct entry count', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    expect(result.entryCount).toBe(2);
  });

  it('returns all keys', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    expect(result.keys).toContain('API_KEY');
    expect(result.keys).toContain('DB_URL');
  });

  it('returns vault path', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    expect(result.path).toBe(tmpVaultPath);
  });

  it('returns algorithm info', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    expect(result.algorithm).toBe('AES-256-GCM');
    expect(result.saltLength).toBe(32);
    expect(result.ivLength).toBe(16);
  });

  it('throws on wrong password', async () => {
    await expect(inspectVault(tmpVaultPath, 'wrong-password')).rejects.toThrow();
  });
});

describe('formatInspect', () => {
  it('includes entry count in output', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    const output = formatInspect(result);
    expect(output).toContain('Entries: 2');
  });

  it('lists all keys in output', async () => {
    const result = await inspectVault(tmpVaultPath, password);
    const output = formatInspect(result);
    expect(output).toContain('API_KEY');
    expect(output).toContain('DB_URL');
  });

  it('shows no entries message for empty vault', async () => {
    const result: import('./inspect').VaultInspectResult = {
      path: '/tmp/empty.vault',
      entryCount: 0,
      keys: [],
      algorithm: 'AES-256-GCM',
      saltLength: 32,
      ivLength: 16,
    };
    const output = formatInspect(result);
    expect(output).toContain('No entries found.');
  });
});
