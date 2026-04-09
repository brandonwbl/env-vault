import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { listCommand, formatList } from './list';
import { addCommand } from './add';
import { createVault, serializeVault, writeVault } from '../crypto';

let tmpDir: string;
let tmpVaultPath: string;
const TEST_PASSWORD = 'test-password-123';

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'env-vault-list-test-'));
  tmpVaultPath = join(tmpDir, 'test.vault');

  const vault = await createVault(TEST_PASSWORD, '');
  await writeVault(tmpVaultPath, serializeVault(vault));

  await addCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'FOO', value: 'bar' });
  await addCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'BAZ', value: 'qux' });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('listCommand', () => {
  it('returns all keys without values by default', async () => {
    const result = await listCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD });
    expect(result.keys).toContain('FOO');
    expect(result.keys).toContain('BAZ');
    expect(result.entries['FOO']).toBe('***');
    expect(result.entries['BAZ']).toBe('***');
  });

  it('returns values when showValues is true', async () => {
    const result = await listCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, showValues: true });
    expect(result.entries['FOO']).toBe('bar');
    expect(result.entries['BAZ']).toBe('qux');
  });

  it('throws on wrong password', async () => {
    await expect(
      listCommand({ vaultPath: tmpVaultPath, password: 'wrong-password' })
    ).rejects.toThrow();
  });

  it('returns empty result for empty vault', async () => {
    const emptyVaultPath = join(tmpDir, 'empty.vault');
    const vault = await createVault(TEST_PASSWORD, '');
    await writeVault(emptyVaultPath, serializeVault(vault));

    const result = await listCommand({ vaultPath: emptyVaultPath, password: TEST_PASSWORD });
    expect(result.keys).toHaveLength(0);
  });
});

describe('formatList', () => {
  it('formats masked values', () => {
    const result = { keys: ['A', 'B'], entries: { A: '***', B: '***' } };
    const output = formatList(result, false);
    expect(output).toBe('A=***\nB=***');
  });

  it('shows message for empty vault', () => {
    const result = { keys: [], entries: {} };
    const output = formatList(result, false);
    expect(output).toContain('No environment variables found');
  });
});
