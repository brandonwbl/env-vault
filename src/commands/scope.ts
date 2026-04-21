import * as fs from 'fs';
import * as path from 'path';

export interface ScopeEntry {
  name: string;
  description?: string;
  keys: string[];
  createdAt: string;
}

export interface ScopeStore {
  scopes: Record<string, ScopeEntry>;
  active?: string;
}

export function getScopePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.vault-scopes.json');
}

export function loadScopes(scopePath: string): ScopeStore {
  if (!fs.existsSync(scopePath)) {
    return { scopes: {} };
  }
  const raw = fs.readFileSync(scopePath, 'utf-8');
  return JSON.parse(raw) as ScopeStore;
}

export function saveScopes(scopePath: string, store: ScopeStore): void {
  fs.writeFileSync(scopePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addScope(store: ScopeStore, name: string, keys: string[], description?: string): ScopeStore {
  if (store.scopes[name]) {
    throw new Error(`Scope "${name}" already exists.`);
  }
  const entry: ScopeEntry = {
    name,
    keys: [...new Set(keys)],
    createdAt: new Date().toISOString(),
  };
  if (description) entry.description = description;
  return { ...store, scopes: { ...store.scopes, [name]: entry } };
}

export function removeScope(store: ScopeStore, name: string): ScopeStore {
  if (!store.scopes[name]) {
    throw new Error(`Scope "${name}" not found.`);
  }
  const scopes = { ...store.scopes };
  delete scopes[name];
  const active = store.active === name ? undefined : store.active;
  return { ...store, scopes, active };
}

export function setActiveScope(store: ScopeStore, name: string): ScopeStore {
  if (!store.scopes[name]) {
    throw new Error(`Scope "${name}" not found.`);
  }
  return { ...store, active: name };
}

export function clearActiveScope(store: ScopeStore): ScopeStore {
  return { ...store, active: undefined };
}

export function getActiveScope(store: ScopeStore): ScopeEntry | undefined {
  if (!store.active) return undefined;
  return store.scopes[store.active];
}

export function formatScopeList(store: ScopeStore): string {
  const entries = Object.values(store.scopes);
  if (entries.length === 0) return 'No scopes defined.';
  return entries
    .map((s) => {
      const active = store.active === s.name ? ' (active)' : '';
      const desc = s.description ? ` — ${s.description}` : '';
      return `  ${s.name}${active}${desc}\n    keys: ${s.keys.join(', ')}`;
    })
    .join('\n');
}
