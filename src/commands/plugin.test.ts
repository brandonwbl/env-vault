import { describe, it, expect, beforeEach } from 'vitest';
import {
  addPlugin, removePlugin, togglePlugin,
  formatPluginList, loadPlugins, savePlugins, getPluginPath
} from './plugin';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpPath = path.join(os.tmpdir(), 'test-vault.json');

const base = { name: 'my-plugin', version: '1.0.0', description: 'A plugin', entrypoint: 'index.js' };

describe('plugin', () => {
  it('adds a plugin', () => {
    const store = addPlugin({ plugins: [] }, base);
    expect(store.plugins).toHaveLength(1);
    expect(store.plugins[0].enabled).toBe(true);
  });

  it('throws on duplicate add', () => {
    const store = addPlugin({ plugins: [] }, base);
    expect(() => addPlugin(store, base)).toThrow("already installed");
  });

  it('removes a plugin', () => {
    const store = addPlugin({ plugins: [] }, base);
    const updated = removePlugin(store, 'my-plugin');
    expect(updated.plugins).toHaveLength(0);
  });

  it('throws on remove not found', () => {
    expect(() => removePlugin({ plugins: [] }, 'nope')).toThrow('not found');
  });

  it('toggles plugin', () => {
    const store = addPlugin({ plugins: [] }, base);
    const disabled = togglePlugin(store, 'my-plugin', false);
    expect(disabled.plugins[0].enabled).toBe(false);
    const enabled = togglePlugin(disabled, 'my-plugin', true);
    expect(enabled.plugins[0].enabled).toBe(true);
  });

  it('formats empty list', () => {
    expect(formatPluginList({ plugins: [] })).toBe('No plugins installed.');
  });

  it('formats plugin list', () => {
    const store = addPlugin({ plugins: [] }, base);
    const out = formatPluginList(store);
    expect(out).toContain('my-plugin');
    expect(out).toContain('✓');
  });

  it('persists and loads plugins', () => {
    const p = getPluginPath(tmpPath);
    const store = addPlugin({ plugins: [] }, base);
    savePlugins(p, store);
    const loaded = loadPlugins(p);
    expect(loaded.plugins).toHaveLength(1);
    fs.unlinkSync(p);
  });
});
