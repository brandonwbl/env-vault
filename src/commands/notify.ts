import fs from 'fs';
import path from 'path';

export interface NotifyChannel {
  id: string;
  type: 'slack' | 'email' | 'webhook';
  target: string;
  events: string[];
  enabled: boolean;
}

export interface NotifyStore {
  channels: NotifyChannel[];
}

export function getNotifyPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.env-vault-notify.json');
}

export function loadNotifyStore(vaultPath: string): NotifyStore {
  const p = getNotifyPath(vaultPath);
  if (!fs.existsSync(p)) return { channels: [] };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveNotifyStore(vaultPath: string, store: NotifyStore): void {
  fs.writeFileSync(getNotifyPath(vaultPath), JSON.stringify(store, null, 2));
}

export function addChannel(store: NotifyStore, channel: NotifyChannel): NotifyStore {
  const filtered = store.channels.filter(c => c.id !== channel.id);
  return { channels: [...filtered, channel] };
}

export function removeChannel(store: NotifyStore, id: string): NotifyStore {
  return { channels: store.channels.filter(c => c.id !== id) };
}

export function toggleChannel(store: NotifyStore, id: string, enabled: boolean): NotifyStore {
  return {
    channels: store.channels.map(c => c.id === id ? { ...c, enabled } : c)
  };
}

export function formatNotifyList(store: NotifyStore): string {
  if (store.channels.length === 0) return 'No notification channels configured.';
  return store.channels.map(c =>
    `[${c.enabled ? 'on' : 'off'}] ${c.id} (${c.type}) → ${c.target} [${c.events.join(', ')}]`
  ).join('\n');
}

export function dispatchNotification(channel: NotifyChannel, event: string, detail: string): void {
  if (!channel.enabled) return;
  if (!channel.events.includes(event) && !channel.events.includes('*')) return;
  // In production this would send HTTP requests; here we log for extensibility
  console.log(`[notify] ${channel.type}:${channel.target} event=${event} detail=${detail}`);
}
