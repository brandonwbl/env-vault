import * as fs from 'fs';
import * as path from 'path';

export interface NamespaceStore {
  namespaces: string[];
  active: string | null;
}

export function getNamespacePath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.namespaces.json`);
}

export function loadNamespaces(nsPath: string): NamespaceStore {
  if (!fs.existsSync(nsPath)) {
    return { namespaces: ['default'], active: 'default' };
  }
  const raw = fs.readFileSync(nsPath, 'utf-8');
  return JSON.parse(raw) as NamespaceStore;
}

export function saveNamespaces(nsPath: string, store: NamespaceStore): void {
  fs.writeFileSync(nsPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addNamespace(store: NamespaceStore, name: string): NamespaceStore {
  if (store.namespaces.includes(name)) {
    throw new Error(`Namespace "${name}" already exists.`);
  }
  return { ...store, namespaces: [...store.namespaces, name] };
}

export function removeNamespace(store: NamespaceStore, name: string): NamespaceStore {
  if (name === 'default') {
    throw new Error('Cannot remove the default namespace.');
  }
  if (!store.namespaces.includes(name)) {
    throw new Error(`Namespace "${name}" not found.`);
  }
  const namespaces = store.namespaces.filter(n => n !== name);
  const active = store.active === name ? 'default' : store.active;
  return { namespaces, active };
}

export function switchNamespace(store: NamespaceStore, name: string): NamespaceStore {
  if (!store.namespaces.includes(name)) {
    throw new Error(`Namespace "${name}" not found.`);
  }
  return { ...store, active: name };
}

export function formatNamespaceList(store: NamespaceStore): string {
  return store.namespaces
    .map(n => (n === store.active ? `* ${n}` : `  ${n}`))
    .join('\n');
}
