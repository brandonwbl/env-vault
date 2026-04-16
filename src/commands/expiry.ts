import fs from 'fs';
import path from 'path';

export interface ExpiryEntry {
  key: string;
  expiresAt: string; // ISO date string
}

export interface ExpiryStore {
  entries: ExpiryEntry[];
}

export function getExpiryPath(vaultPath: string): string {
  return vaultPath.replace(/\.vault$/, '.expiry.json');
}

export function loadExpiryStore(vaultPath: string): ExpiryStore {
  const p = getExpiryPath(vaultPath);
  if (!fs.existsSync(p)) return { entries: [] };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveExpiryStore(vaultPath: string, store: ExpiryStore): void {
  fs.writeFileSync(getExpiryPath(vaultPath), JSON.stringify(store, null, 2));
}

export function setExpiry(vaultPath: string, key: string, expiresAt: Date): ExpiryStore {
  const store = loadExpiryStore(vaultPath);
  const existing = store.entries.findIndex(e => e.key === key);
  const entry: ExpiryEntry = { key, expiresAt: expiresAt.toISOString() };
  if (existing >= 0) store.entries[existing] = entry;
  else store.entries.push(entry);
  saveExpiryStore(vaultPath, store);
  return store;
}

export function removeExpiry(vaultPath: string, key: string): ExpiryStore {
  const store = loadExpiryStore(vaultPath);
  store.entries = store.entries.filter(e => e.key !== key);
  saveExpiryStore(vaultPath, store);
  return store;
}

export function getExpiredKeys(vaultPath: string, now: Date = new Date()): string[] {
  const store = loadExpiryStore(vaultPath);
  return store.entries
    .filter(e => new Date(e.expiresAt) <= now)
    .map(e => e.key);
}

export function formatExpiryList(store: ExpiryStore): string {
  if (store.entries.length === 0) return 'No expiry entries set.';
  return store.entries
    .map(e => `${e.key} => ${new Date(e.expiresAt).toLocaleString()}`)
    .join('\n');
}
