import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createVault, serializeVault, writeVault } from '../crypto';
import { diffVaults, formatDiff } from './diff';

const PASSWORD = 'test-password-123';

async function makeTempVault(
  dir: string,
  name: string,
  variables: Record<string, string>
): Promise<string> {
  const vaultPath = path.join(dir, name);
  const vault = await createVault(variables, PASSWORD);
  const serialized = await serializeVault(vault, PASSWORD);
  await writeVault(vaultPath, serialized);
  return vaultPath;
}

describe('diffVaults', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-vault-diff-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects added keys', async () => {
    const a = await makeTempVault(tmpDir, 'a.vault', { FOO: 'bar' });
    const b = await makeTempVault(tmpDir, 'b.vault', { FOO: 'bar', NEW: 'value' });
    const diff = await diffVaults(a, b, PASSWORD);
    expect(diff.added).toEqual({ NEW: 'value' });
    expect(diff.removed).toEqual({});
    expect(diff.changed).toEqual({});
  });

  it('detects removed keys', async () => {
    const a = await makeTempVault(tmpDir, 'a.vault', { FOO: 'bar', OLD: 'gone' });
    const b = await makeTempVault(tmpDir, 'b.vault', { FOO: 'bar' });
    const diff = await diffVaults(a, b, PASSWORD);
    expect(diff.removed).toEqual({ OLD: 'gone' });
    expect(diff.added).toEqual({});
  });

  it('detects changed values', async () => {
    const a = await makeTempVault(tmpDir, 'a.vault', { FOO: 'old' });
    const b = await makeTempVault(tmpDir, 'b.vault', { FOO: 'new' });
    const diff = await diffVaults(a, b, PASSWORD);
    expect(diff.changed).toEqual({ FOO: { from: 'old', to: 'new' } });
  });

  it('returns empty diff for identical vaults', async () => {
    const vars = { FOO: 'bar', BAZ: 'qux' };
    const a = await makeTempVault(tmpDir, 'a.vault', vars);
    const b = await makeTempVault(tmpDir, 'b.vault', vars);
    const diff = await diffVaults(a, b, PASSWORD);
    expect(diff.added).toEqual({});
    expect(diff.removed).toEqual({});
    expect(diff.changed).toEqual({});
  });

  it('throws when vault file does not exist', async () => {
    const missing = path.join(tmpDir, 'missing.vault');
    const b = await makeTempVault(tmpDir, 'b.vault', { FOO: 'bar' });
    await expect(diffVaults(missing, b, PASSWORD)).rejects.toThrow();
  });

  it('throws when password is wrong', async () => {
    const a = await makeTempVault(tmpDir, 'a.vault', { FOO: 'bar' });
    const b = await makeTempVault(tmpDir, 'b.vault', { FOO: 'baz' });
    await expect(diffVaults(a, b, 'wrong-password')).rejects.toThrow();
  });
});

describe('formatDiff', () => {
  it('formats a mixed diff', () => {
    const result = formatDiff({
      added: { NEW: 'val' },
      removed: { OLD: 'gone' },
      changed: { FOO: { from: 'a', to: 'b' } },
    });
    expect(result).toContain('+ NEW=val');
    expect(result).toContain('- OLD=gone');
    expect(result).toContain('~ FOO: "a" → "b"');
  });

  it('returns no-diff message when empty', () => {
    const result = formatDiff({ added: {}, removed: {}, changed: {} });
    expect(result).toBe('No differences found.');
  });
});
