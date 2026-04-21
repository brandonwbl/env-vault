import * as fs from 'fs';
import * as path from 'path';

export interface DeprecationEntry {
  key: string;
  reason: string;
  since: string;
  replacedBy?: string;
}

export interface DeprecationStore {
  entries: DeprecationEntry[];
}

export function getDeprecatePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.deprecations.json');
}

export function loadDeprecationStore(vaultPath: string): DeprecationStore {
  const p = getDeprecatePath(vaultPath);
  if (!fs.existsSync(p)) return { entries: [] };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveDeprecationStore(vaultPath: string, store: DeprecationStore): void {
  fs.writeFileSync(getDeprecatePath(vaultPath), JSON.stringify(store, null, 2));
}

export function markDeprecated(
  store: DeprecationStore,
  key: string,
  reason: string,
  replacedBy?: string
): DeprecationStore {
  const since = new Date().toISOString();
  const existing = store.entries.findIndex((e) => e.key === key);
  const entry: DeprecationEntry = { key, reason, since, ...(replacedBy ? { replacedBy } : {}) };
  if (existing >= 0) {
    const updated = [...store.entries];
    updated[existing] = entry;
    return { entries: updated };
  }
  return { entries: [...store.entries, entry] };
}

export function unmarkDeprecated(store: DeprecationStore, key: string): DeprecationStore {
  return { entries: store.entries.filter((e) => e.key !== key) };
}

export function getDeprecation(store: DeprecationStore, key: string): DeprecationEntry | undefined {
  return store.entries.find((e) => e.key === key);
}

export function formatDeprecationList(store: DeprecationStore): string {
  if (store.entries.length === 0) return 'No deprecated keys.';
  return store.entries
    .map((e) => {
      const replacement = e.replacedBy ? ` → replaced by: ${e.replacedBy}` : '';
      return `  [DEPRECATED] ${e.key}${replacement}\n    Reason: ${e.reason}\n    Since:  ${e.since}`;
    })
    .join('\n');
}
