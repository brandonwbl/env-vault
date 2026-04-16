import * as fs from 'fs';
import * as path from 'path';

export interface RelayTarget {
  id: string;
  url: string;
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export interface RelayStore {
  targets: RelayTarget[];
}

export function getRelayPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.relay.json');
}

export function loadRelayStore(relayPath: string): RelayStore {
  if (!fs.existsSync(relayPath)) return { targets: [] };
  return JSON.parse(fs.readFileSync(relayPath, 'utf-8'));
}

export function saveRelayStore(relayPath: string, store: RelayStore): void {
  fs.writeFileSync(relayPath, JSON.stringify(store, null, 2));
}

export function addRelayTarget(store: RelayStore, url: string, secret: string): RelayTarget {
  const target: RelayTarget = {
    id: Math.random().toString(36).slice(2, 10),
    url,
    secret,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  store.targets.push(target);
  return target;
}

export function removeRelayTarget(store: RelayStore, id: string): boolean {
  const before = store.targets.length;
  store.targets = store.targets.filter(t => t.id !== id);
  return store.targets.length < before;
}

export function toggleRelayTarget(store: RelayStore, id: string, enabled: boolean): boolean {
  const target = store.targets.find(t => t.id === id);
  if (!target) return false;
  target.enabled = enabled;
  return true;
}

export function formatRelayList(store: RelayStore): string {
  if (store.targets.length === 0) return 'No relay targets configured.';
  return store.targets
    .map(t => `[${t.enabled ? 'ON' : 'OFF'}] ${t.id}  ${t.url}  (added ${t.createdAt.slice(0, 10)})`)
    .join('\n');
}
