import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPluginCommands } from './plugin-cmd';
import { getPluginPath, loadPlugins } from './plugin';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpVault = path.join(os.tmpdir(), 'plugin-cmd-vault.json');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPluginCommands(program, tmpVault);
  return program;
}

afterEach(() => {
  const p = getPluginPath(tmpVault);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('plugin-cmd', () => {
  it('adds and lists a plugin', () => {
    const program = buildProgram();
    program.parse(['plugin', 'add', 'myplugin', '1.0.0', 'desc', 'index.js'], { from: 'user' });
    const store = loadPlugins(getPluginPath(tmpVault));
    expect(store.plugins[0].name).toBe('myplugin');
  });

  it('removes a plugin', () => {
    const program = buildProgram();
    program.parse(['plugin', 'add', 'myplugin', '1.0.0', 'desc', 'index.js'], { from: 'user' });
    program.parse(['plugin', 'remove', 'myplugin'], { from: 'user' });
    const store = loadPlugins(getPluginPath(tmpVault));
    expect(store.plugins).toHaveLength(0);
  });

  it('disables and enables a plugin', () => {
    const program = buildProgram();
    program.parse(['plugin', 'add', 'myplugin', '1.0.0', 'desc', 'index.js'], { from: 'user' });
    program.parse(['plugin', 'disable', 'myplugin'], { from: 'user' });
    expect(loadPlugins(getPluginPath(tmpVault)).plugins[0].enabled).toBe(false);
    program.parse(['plugin', 'enable', 'myplugin'], { from: 'user' });
    expect(loadPlugins(getPluginPath(tmpVault)).plugins[0].enabled).toBe(true);
  });
});
