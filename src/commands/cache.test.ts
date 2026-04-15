import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getCachePath,
  loadCache,
  saveCache,
  setCacheEntry,
  getCacheEntry,
  evictExpired,
  clearCache,
  formatCacheList,
} from './cache';

const tmpVaultPath = path.join(os.tmpdir(), 'test-vault-cache.env-vault');

afterEach(() => {
  const cp = getCachePath(tmpVaultPath);
  if (fs.existsSync(cp)) fs.unlinkSync(cp);
});

describe('loadCache', () => {
  it('returns empty store when no cache file exists', () => {
    const store = loadCache(tmpVaultPath);
    expect(store.entries).toHaveLength(0);
    expect(store.vaultPath).toBe(tmpVaultPath);
  });
});

describe('setCacheEntry / getCacheEntry', () => {
  it('stores and retrieves a value', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'DB_URL', 'postgres://localhost');
    const entry = getCacheEntry(store, 'DB_URL');
    expect(entry).not.toBeNull();
    expect(entry!.value).toBe('postgres://localhost');
    expect(entry!.expiresAt).toBeNull();
  });

  it('overwrites an existing key', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'KEY', 'v1');
    store = setCacheEntry(store, 'KEY', 'v2');
    expect(store.entries.filter((e) => e.key === 'KEY')).toHaveLength(1);
    expect(getCacheEntry(store, 'KEY')!.value).toBe('v2');
  });

  it('returns null for expired entry', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'TEMP', 'val', -1);
    expect(getCacheEntry(store, 'TEMP')).toBeNull();
  });

  it('returns null for missing key', () => {
    const store = loadCache(tmpVaultPath);
    expect(getCacheEntry(store, 'MISSING')).toBeNull();
  });
});

describe('evictExpired', () => {
  it('removes expired entries and keeps valid ones', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'LIVE', 'yes', 3600);
    store = setCacheEntry(store, 'DEAD', 'no', -1);
    store = evictExpired(store);
    expect(store.entries.map((e) => e.key)).toEqual(['LIVE']);
  });
});

describe('clearCache', () => {
  it('removes all entries', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'A', '1');
    store = setCacheEntry(store, 'B', '2');
    store = clearCache(store);
    expect(store.entries).toHaveLength(0);
  });
});

describe('saveCache / loadCache round-trip', () => {
  it('persists and reloads entries', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'PERSIST', 'hello');
    saveCache(store);
    const reloaded = loadCache(tmpVaultPath);
    expect(getCacheEntry(reloaded, 'PERSIST')!.value).toBe('hello');
  });
});

describe('formatCacheList', () => {
  it('returns empty message when cache is empty', () => {
    const store = loadCache(tmpVaultPath);
    expect(formatCacheList(store)).toBe('Cache is empty.');
  });

  it('lists active entries', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'API_KEY', 'secret', 3600);
    const output = formatCacheList(store);
    expect(output).toContain('API_KEY');
    expect(output).toContain('expires');
  });

  it('excludes expired entries from listing', () => {
    let store = loadCache(tmpVaultPath);
    store = setCacheEntry(store, 'OLD', 'val', -1);
    expect(formatCacheList(store)).toBe('Cache is empty.');
  });
});
