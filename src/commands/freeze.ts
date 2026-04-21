import * as fs from 'fs';
import * as path from 'path';

export interface FreezeStore {
  frozenKeys: string[];
  frozenAt: Record<string, string>;
}

export function getFreezePath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.freeze.json`);
}

export function loadFreezeStore(freezePath: string): FreezeStore {
  if (!fs.existsSync(freezePath)) {
    return { frozenKeys: [], frozenAt: {} };
  }
  const raw = fs.readFileSync(freezePath, 'utf-8');
  return JSON.parse(raw) as FreezeStore;
}

export function saveFreezeStore(freezePath: string, store: FreezeStore): void {
  fs.writeFileSync(freezePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function freezeKey(store: FreezeStore, key: string): FreezeStore {
  if (store.frozenKeys.includes(key)) {
    return store;
  }
  return {
    frozenKeys: [...store.frozenKeys, key],
    frozenAt: { ...store.frozenAt, [key]: new Date().toISOString() },
  };
}

export function unfreezeKey(store: FreezeStore, key: string): FreezeStore {
  const frozenAt = { ...store.frozenAt };
  delete frozenAt[key];
  return {
    frozenKeys: store.frozenKeys.filter((k) => k !== key),
    frozenAt,
  };
}

export function isFrozen(store: FreezeStore, key: string): boolean {
  return store.frozenKeys.includes(key);
}

export function formatFreezeList(store: FreezeStore): string {
  if (store.frozenKeys.length === 0) {
    return 'No frozen keys.';
  }
  const lines = store.frozenKeys.map(
    (k) => `  ${k}  (frozen at ${store.frozenAt[k] ?? 'unknown'})`
  );
  return `Frozen keys:\n${lines.join('\n')}`;
}
