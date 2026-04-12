import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { compareEntries, formatCompare, compareCommand } from './compare';
import { createVault, serializeVault, writeVault } from '../crypto';

const tmpDir = os.tmpdir();
const vaultPathA = path.join(tmpDir, 'compare-test-a.vault');
const vaultPathB = path.join(tmpDir, 'compare-test-b.vault');
const password = 'compare-secret';

async function makeVault(filePath: string, entries: { key: string; value: string }[]) {
  const vault = createVault();
  vault.entries = entries.map((e) => ({ ...e, tags: [] }));
  const serialized = await serializeVault(vault, password);
  await writeVault(filePath, serialized);
}

beforeEach(async () => {
  await makeVault(vaultPathA, [
    { key: 'SHARED', value: 'same' },
    { key: 'ONLY_A', value: 'alpha' },
    { key: 'DIFF', value: 'from-a' },
  ]);
  await makeVault(vaultPathB, [
    { key: 'SHARED', value: 'same' },
    { key: 'ONLY_B', value: 'beta' },
    { key: 'DIFF', value: 'from-b' },
  ]);
});

afterEach(async () => {
  await fs.rm(vaultPathA, { force: true });
  await fs.rm(vaultPathB, { force: true });
});

describe('compareEntries', () => {
  it('identifies keys only in A', () => {
    const a = [{ key: 'X', value: '1', tags: [] }];
    const b = [{ key: 'Y', value: '2', tags: [] }];
    const result = compareEntries(a, b);
    expect(result.onlyInA).toContain('X');
    expect(result.onlyInB).toContain('Y');
  });

  it('identifies identical keys', () => {
    const a = [{ key: 'K', value: 'v', tags: [] }];
    const b = [{ key: 'K', value: 'v', tags: [] }];
    const result = compareEntries(a, b);
    expect(result.identical).toContain('K');
    expect(result.different).toHaveLength(0);
  });

  it('identifies differing values', () => {
    const a = [{ key: 'K', value: 'v1', tags: [] }];
    const b = [{ key: 'K', value: 'v2', tags: [] }];
    const result = compareEntries(a, b);
    expect(result.different[0]).toMatchObject({ key: 'K', valueA: 'v1', valueB: 'v2' });
  });
});

describe('formatCompare', () => {
  it('includes section headers in output', () => {
    const result = {
      onlyInA: ['A_KEY'],
      onlyInB: ['B_KEY'],
      different: [{ key: 'D', valueA: 'x', valueB: 'y' }],
      identical: ['SAME'],
    };
    const output = formatCompare(result, 'a.vault', 'b.vault');
    expect(output).toContain('Only in a.vault');
    expect(output).toContain('Only in b.vault');
    expect(output).toContain('Different values');
    expect(output).toContain('Identical: 1 key(s)');
  });
});

describe('compareCommand', () => {
  it('returns formatted comparison of two vaults', async () => {
    const output = await compareCommand(vaultPathA, password, vaultPathB, password);
    expect(output).toContain('ONLY_A');
    expect(output).toContain('ONLY_B');
    expect(output).toContain('DIFF');
    expect(output).toContain('Identical: 1 key(s)');
  });
});
