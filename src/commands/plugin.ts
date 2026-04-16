import fs from 'fs';
import path from 'path';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  entrypoint: string;
  enabled: boolean;
  installedAt: string;
}

export interface PluginStore {
  plugins: Plugin[];
}

export function getPluginPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.plugins.json');
}

export function loadPlugins(pluginPath: string): PluginStore {
  if (!fs.existsSync(pluginPath)) return { plugins: [] };
  return JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
}

export function savePlugins(pluginPath: string, store: PluginStore): void {
  fs.writeFileSync(pluginPath, JSON.stringify(store, null, 2));
}

export function addPlugin(store: PluginStore, plugin: Omit<Plugin, 'installedAt' | 'enabled'>): PluginStore {
  if (store.plugins.find(p => p.name === plugin.name)) {
    throw new Error(`Plugin '${plugin.name}' already installed`);
  }
  return {
    plugins: [...store.plugins, { ...plugin, enabled: true, installedAt: new Date().toISOString() }]
  };
}

export function removePlugin(store: PluginStore, name: string): PluginStore {
  if (!store.plugins.find(p => p.name === name)) {
    throw new Error(`Plugin '${name}' not found`);
  }
  return { plugins: store.plugins.filter(p => p.name !== name) };
}

export function togglePlugin(store: PluginStore, name: string, enabled: boolean): PluginStore {
  return {
    plugins: store.plugins.map(p => p.name === name ? { ...p, enabled } : p)
  };
}

export function formatPluginList(store: PluginStore): string {
  if (store.plugins.length === 0) return 'No plugins installed.';
  return store.plugins
    .map(p => `${p.enabled ? '✓' : '✗'} ${p.name}@${p.version} — ${p.description}`)
    .join('\n');
}
