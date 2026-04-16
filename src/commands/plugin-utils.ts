import { Plugin, PluginStore } from './plugin';

export function findPlugin(store: PluginStore, name: string): Plugin | undefined {
  return store.plugins.find(p => p.name === name);
}

export function listEnabledPlugins(store: PluginStore): Plugin[] {
  return store.plugins.filter(p => p.enabled);
}

export function listDisabledPlugins(store: PluginStore): Plugin[] {
  return store.plugins.filter(p => !p.enabled);
}

export function pluginSummary(store: PluginStore): string {
  const total = store.plugins.length;
  const enabled = listEnabledPlugins(store).length;
  return `${total} plugin(s) installed, ${enabled} enabled, ${total - enabled} disabled.`;
}

export function mergePluginStores(base: PluginStore, incoming: PluginStore): PluginStore {
  const names = new Set(base.plugins.map(p => p.name));
  const merged = [...base.plugins];
  for (const p of incoming.plugins) {
    if (!names.has(p.name)) merged.push(p);
  }
  return { plugins: merged };
}
