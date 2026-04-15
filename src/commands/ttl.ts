import * as fs from 'fs';
import * as path from 'path';

export interface TtlEntry {
  key: string;
  expiresAt: number; // Unix timestamp in ms
}

export interface TtlStore {
  entries: TtlEntry[];
}

export function getTtlPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.ttl.json`);
}

export function loadTtlStore(vaultPath: string): TtlStore {
  const ttlPath = getTtlPath(vaultPath);
  if (!fs.existsSync(ttlPath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(ttlPath, 'utf-8');
  return JSON.parse(raw) as TtlStore;
}

export function saveTtlStore(vaultPath: string, store: TtlStore): void {
  const ttlPath = getTtlPath(vaultPath);
  fs.writeFileSync(ttlPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setTtl(vaultPath: string, key: string, ttlSeconds: number): TtlEntry {
  const store = loadTtlStore(vaultPath);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const existing = store.entries.findIndex(e => e.key === key);
  const entry: TtlEntry = { key, expiresAt };
  if (existing >= 0) {
    store.entries[existing] = entry;
  } else {
    store.entries.push(entry);
  }
  saveTtlStore(vaultPath, store);
  return entry;
}

export function removeTtl(vaultPath: string, key: string): boolean {
  const store = loadTtlStore(vaultPath);
  const before = store.entries.length;
  store.entries = store.entries.filter(e => e.key !== key);
  if (store.entries.length !== before) {
    saveTtlStore(vaultPath, store);
    return true;
  }
  return false;
}

export function getExpiredKeys(vaultPath: string, now: number = Date.now()): string[] {
  const store = loadTtlStore(vaultPath);
  return store.entries.filter(e => e.expiresAt <= now).map(e => e.key);
}

export function formatTtlList(store: TtlStore, now: number = Date.now()): string {
  if (store.entries.length === 0) {
    return 'No TTL entries set.';
  }
  return store.entries
    .map(e => {
      const remainingMs = e.expiresAt - now;
      const status =
        remainingMs <= 0
          ? 'EXPIRED'
          : `expires in ${Math.ceil(remainingMs / 1000)}s`;
      return `  ${e.key}: ${status} (${new Date(e.expiresAt).toISOString()})`;
    })
    .join('\n');
}
