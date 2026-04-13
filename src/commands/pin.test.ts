import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getPinnedEntries,
  pinEntry,
  unpinEntry,
  formatPinnedList,
  PinnedEntry,
} from './pin';

const makeVault = (pinned: PinnedEntry[] = []) => ({
  entries: { API_KEY: 'secret' },
  meta: { pinned },
});

describe('getPinnedEntries', () => {
  it('returns empty array when no meta', () => {
    expect(getPinnedEntries({ entries: {} })).toEqual([]);
  });

  it('returns pinned entries from meta', () => {
    const vault = makeVault([{ key: 'API_KEY', pinnedAt: '2024-01-01T00:00:00.000Z' }]);
    expect(getPinnedEntries(vault)).toHaveLength(1);
  });
});

describe('pinEntry', () => {
  it('pins a new entry', () => {
    const vault = makeVault();
    const { vault: updated, alreadyPinned } = pinEntry(vault, 'API_KEY');
    expect(alreadyPinned).toBe(false);
    expect(getPinnedEntries(updated)).toHaveLength(1);
    expect(getPinnedEntries(updated)[0].key).toBe('API_KEY');
  });

  it('stores optional note', () => {
    const vault = makeVault();
    const { vault: updated } = pinEntry(vault, 'API_KEY', 'critical key');
    expect(getPinnedEntries(updated)[0].note).toBe('critical key');
  });

  it('returns alreadyPinned=true for duplicate', () => {
    const vault = makeVault([{ key: 'API_KEY', pinnedAt: '2024-01-01T00:00:00.000Z' }]);
    const { alreadyPinned } = pinEntry(vault, 'API_KEY');
    expect(alreadyPinned).toBe(true);
  });

  it('does not mutate original vault', () => {
    const vault = makeVault();
    pinEntry(vault, 'API_KEY');
    expect(getPinnedEntries(vault)).toHaveLength(0);
  });
});

describe('unpinEntry', () => {
  it('removes a pinned entry', () => {
    const vault = makeVault([{ key: 'API_KEY', pinnedAt: '2024-01-01T00:00:00.000Z' }]);
    const { vault: updated, wasFound } = unpinEntry(vault, 'API_KEY');
    expect(wasFound).toBe(true);
    expect(getPinnedEntries(updated)).toHaveLength(0);
  });

  it('returns wasFound=false for missing key', () => {
    const vault = makeVault();
    const { wasFound } = unpinEntry(vault, 'MISSING_KEY');
    expect(wasFound).toBe(false);
  });
});

describe('formatPinnedList', () => {
  it('returns message when empty', () => {
    expect(formatPinnedList([])).toBe('No pinned entries.');
  });

  it('formats entries with date', () => {
    const pinned: PinnedEntry[] = [{ key: 'API_KEY', pinnedAt: '2024-06-01T12:00:00.000Z' }];
    const result = formatPinnedList(pinned);
    expect(result).toContain('API_KEY');
    expect(result).toContain('2024-06-01T12:00:00.000Z');
  });

  it('includes note when present', () => {
    const pinned: PinnedEntry[] = [{ key: 'DB_PASS', pinnedAt: '2024-06-01T12:00:00.000Z', note: 'do not rotate' }];
    expect(formatPinnedList(pinned)).toContain('do not rotate');
  });
});
