import * as fs from 'fs';
import * as path from 'path';

export interface ChmodEntry {
  key: string;
  owner: string;
  permissions: ('read' | 'write')[]; 
}

export interface ChmodStore {
  entries: ChmodEntry[];
}

export function getChmodPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.chmod.json`);
}

export function loadChmod(chmodPath: string): ChmodStore {
  if (!fs.existsSync(chmodPath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(chmodPath, 'utf-8');
  return JSON.parse(raw) as ChmodStore;
}

export function saveChmod(chmodPath: string, store: ChmodStore): void {
  fs.writeFileSync(chmodPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function setPermission(
  store: ChmodStore,
  key: string,
  owner: string,
  permissions: ('read' | 'write')[]
): ChmodStore {
  const filtered = store.entries.filter(
    (e) => !(e.key === key && e.owner === owner)
  );
  return { entries: [...filtered, { key, owner, permissions }] };
}

export function removePermission(
  store: ChmodStore,
  key: string,
  owner: string
): ChmodStore {
  return {
    entries: store.entries.filter(
      (e) => !(e.key === key && e.owner === owner)
    ),
  };
}

export function canAccess(
  store: ChmodStore,
  key: string,
  owner: string,
  permission: 'read' | 'write'
): boolean {
  const entry = store.entries.find(
    (e) => e.key === key && e.owner === owner
  );
  return entry ? entry.permissions.includes(permission) : false;
}

export function formatChmodList(store: ChmodStore): string {
  if (store.entries.length === 0) {
    return 'No permission entries found.';
  }
  return store.entries
    .map((e) => `${e.key}\t${e.owner}\t[${e.permissions.join(', ')}]`)
    .join('\n');
}
