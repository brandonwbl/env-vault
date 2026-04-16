import * as fs from 'fs';
import * as path from 'path';

export interface EnvGroup {
  name: string;
  keys: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvGroupStore {
  groups: Record<string, EnvGroup>;
}

export function getEnvGroupPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.groups.json`);
}

export function loadEnvGroups(groupPath: string): EnvGroupStore {
  if (!fs.existsSync(groupPath)) {
    return { groups: {} };
  }
  const raw = fs.readFileSync(groupPath, 'utf-8');
  return JSON.parse(raw) as EnvGroupStore;
}

export function saveEnvGroups(groupPath: string, store: EnvGroupStore): void {
  fs.writeFileSync(groupPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addGroup(
  store: EnvGroupStore,
  name: string,
  keys: string[],
  description?: string
): EnvGroupStore {
  const now = new Date().toISOString();
  store.groups[name] = {
    name,
    keys: [...new Set(keys)],
    description,
    createdAt: store.groups[name]?.createdAt ?? now,
    updatedAt: now,
  };
  return store;
}

export function removeGroup(store: EnvGroupStore, name: string): EnvGroupStore {
  delete store.groups[name];
  return store;
}

export function addKeyToGroup(
  store: EnvGroupStore,
  name: string,
  key: string
): EnvGroupStore {
  if (!store.groups[name]) throw new Error(`Group '${name}' not found`);
  const group = store.groups[name];
  if (!group.keys.includes(key)) {
    group.keys.push(key);
    group.updatedAt = new Date().toISOString();
  }
  return store;
}

export function removeKeyFromGroup(
  store: EnvGroupStore,
  name: string,
  key: string
): EnvGroupStore {
  if (!store.groups[name]) throw new Error(`Group '${name}' not found`);
  const group = store.groups[name];
  group.keys = group.keys.filter((k) => k !== key);
  group.updatedAt = new Date().toISOString();
  return store;
}

export function formatGroupList(store: EnvGroupStore): string {
  const groups = Object.values(store.groups);
  if (groups.length === 0) return 'No groups defined.';
  return groups
    .map((g) => {
      const desc = g.description ? ` — ${g.description}` : '';
      return `[${g.name}]${desc}\n  Keys: ${g.keys.join(', ') || '(none)'}`;
    })
    .join('\n');
}
