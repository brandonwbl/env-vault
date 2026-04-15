import { VaultEntry } from '../crypto/vault';
import { NamespaceStore } from './namespace';

export const NAMESPACE_KEY_SEPARATOR = ':';

export function qualifyKey(namespace: string, key: string): string {
  if (namespace === 'default') return key;
  return `${namespace}${NAMESPACE_KEY_SEPARATOR}${key}`;
}

export function unqualifyKey(qualifiedKey: string): { namespace: string; key: string } {
  const idx = qualifiedKey.indexOf(NAMESPACE_KEY_SEPARATOR);
  if (idx === -1) return { namespace: 'default', key: qualifiedKey };
  return {
    namespace: qualifiedKey.slice(0, idx),
    key: qualifiedKey.slice(idx + 1),
  };
}

export function filterEntriesByNamespace(
  entries: VaultEntry[],
  namespace: string
): VaultEntry[] {
  return entries
    .filter(e => {
      const { namespace: ns } = unqualifyKey(e.key);
      return ns === namespace;
    })
    .map(e => ({
      ...e,
      key: unqualifyKey(e.key).key,
    }));
}

export function resolveActiveNamespace(store: NamespaceStore): string {
  return store.active ?? 'default';
}

export function listNamespacesFromEntries(entries: VaultEntry[]): string[] {
  const nsSet = new Set<string>();
  for (const entry of entries) {
    const { namespace } = unqualifyKey(entry.key);
    nsSet.add(namespace);
  }
  return Array.from(nsSet).sort();
}
