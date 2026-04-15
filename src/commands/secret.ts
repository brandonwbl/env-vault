import * as fs from 'fs';
import * as path from 'path';

export interface SecretMask {
  key: string;
  masked: boolean;
  preview: boolean;
}

export interface SecretStore {
  masks: Record<string, SecretMask>;
}

export function getSecretPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.secret-masks.json');
}

export function loadSecretStore(vaultPath: string): SecretStore {
  const p = getSecretPath(vaultPath);
  if (!fs.existsSync(p)) return { masks: {} };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveSecretStore(vaultPath: string, store: SecretStore): void {
  fs.writeFileSync(getSecretPath(vaultPath), JSON.stringify(store, null, 2));
}

export function maskKey(vaultPath: string, key: string, preview = false): SecretStore {
  const store = loadSecretStore(vaultPath);
  store.masks[key] = { key, masked: true, preview };
  saveSecretStore(vaultPath, store);
  return store;
}

export function unmaskKey(vaultPath: string, key: string): SecretStore {
  const store = loadSecretStore(vaultPath);
  delete store.masks[key];
  saveSecretStore(vaultPath, store);
  return store;
}

export function isMasked(store: SecretStore, key: string): boolean {
  return !!store.masks[key]?.masked;
}

export function applyMask(value: string, preview: boolean): string {
  if (!preview) return '********';
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}

export function formatSecretList(store: SecretStore): string {
  const entries = Object.values(store.masks);
  if (entries.length === 0) return 'No masked keys.';
  return entries
    .map(e => `  ${e.key} [${e.preview ? 'preview' : 'full mask'}]`)
    .join('\n');
}
