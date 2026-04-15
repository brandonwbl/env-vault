import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CacheEntry {
  key: string;
  value: string;
  cachedAt: string;
  expiresAt: string | null;
}

export interface CacheStore {
  vaultPath: string;
  entries: CacheEntry[];
}

export function getCachePath(vaultPath: string): string {
  const hash = Buffer.from(vaultPath).toString('base64').replace(/[/+=]/g, '_');
  return path.join(os.tmpdir(), `env-vault-cache-${hash}.json`);
}

export function loadCache(vaultPath: string): CacheStore {
  const cachePath = getCachePath(vaultPath);
  if (!fs.existsSync(cachePath)) {
    return { vaultPath, entries: [] };
  }
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(raw) as CacheStore;
  } catch {
    return { vaultPath, entries: [] };
  }
}

export function saveCache(store: CacheStore): void {
  const cachePath = getCachePath(store.vaultPath);
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setCacheEntry(
  store: CacheStore,
  key: string,
  value: string,
  ttlSeconds?: number
): CacheStore {
  const now = new Date();
  const expiresAt = ttlSeconds
    ? new Date(now.getTime() + ttlSeconds * 1000).toISOString()
    : null;
  const existing = store.entries.findIndex((e) => e.key === key);
  const entry: CacheEntry = {
    key,
    value,
    cachedAt: now.toISOString(),
    expiresAt,
  };
  const entries = [...store.entries];
  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }
  return { ...store, entries };
}

export function getCacheEntry(
  store: CacheStore,
  key: string
): CacheEntry | null {
  const entry = store.entries.find((e) => e.key === key);
  if (!entry) return null;
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return null;
  }
  return entry;
}

export function evictExpired(store: CacheStore): CacheStore {
  const now = new Date();
  const entries = store.entries.filter(
    (e) => !e.expiresAt || new Date(e.expiresAt) >= now
  );
  return { ...store, entries };
}

export function clearCache(store: CacheStore): CacheStore {
  return { ...store, entries: [] };
}

export function formatCacheList(store: CacheStore): string {
  const active = evictExpired(store).entries;
  if (active.length === 0) return 'Cache is empty.';
  return active
    .map((e) => {
      const expiry = e.expiresAt
        ? `expires ${new Date(e.expiresAt).toLocaleString()}`
        : 'no expiry';
      return `  ${e.key} (${expiry})`;
    })
    .join('\n');
}
