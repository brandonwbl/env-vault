import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { computeStats, formatStats, statsCommand } from './stats';
import { createVault, serializeVault, writeVault } from '../crypto';
import { VaultEntry } from '../crypto/vault';

const tmpVaultPath = path.join(os.tmpdir(), 'stats-test.vault');
const password = 'stats-secret';

const sampleEntries: VaultEntry[] = [
  { key: 'A', value: 'hello', tags: ['prod'] },
  { key: 'LONG_KEY_NAME', value: 'world', tags: [] },
  { key: 'MID', value: 'foo', tags: ['dev', 'prod'] },
];

beforeEach(async () => {
  const vault = createVault();
  vault.entries = sampleEntries;
  const serialized = await serializeVault(vault, password);
  await writeVault(tmpVaultPath, serialized);
});

afterEach(async () => {
  await fs.rm(tmpVaultPath, { force: true });
});

describe('computeStats', () => {
  it('returns zeros for empty entries', () => {
    const stats = computeStats([]);
    expect(stats.totalKeys).toBe(0);
    expect(stats.shortestKey).toBeNull();
  });

  it('counts total keys correctly', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.totalKeys).toBe(3);
  });

  it('counts tagged and untagged keys', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.taggedKeys).toBe(2);
    expect(stats.untaggedKeys).toBe(1);
  });

  it('collects unique tags', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.uniqueTags).toEqual(['dev', 'prod']);
  });

  it('computes shortest and longest key', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.shortestKey).toBe('A');
    expect(stats.longestKey).toBe('LONG_KEY_NAME');
  });

  it('computes average value length', () => {
    const stats = computeStats(sampleEntries);
    // (5 + 5 + 3) / 3 = 4.33 -> rounds to 4
    expect(stats.avgValueLength).toBe(4);
  });
});

describe('formatStats', () => {
  it('includes all stat labels in output', () => {
    const stats = computeStats(sampleEntries);
    const output = formatStats(stats);
    expect(output).toContain('Total keys');
    expect(output).toContain('Tagged keys');
    expect(output).toContain('Unique tags');
    expect(output).toContain('Avg value len');
  });

  it('shows (none) when no tags exist', () => {
    const stats = computeStats([{ key: 'X', value: 'y', tags: [] }]);
    expect(formatStats(stats)).toContain('(none)');
  });
});

describe('statsCommand', () => {
  it('returns formatted stats for a vault', async () => {
    const output = await statsCommand(tmpVaultPath, password);
    expect(output).toContain('Total keys     : 3');
    expect(output).toContain('prod');
  });
});
