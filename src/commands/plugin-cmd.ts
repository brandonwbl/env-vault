import { Command } from 'commander';
import {
  getPluginPath, loadPlugins, savePlugins,
  addPlugin, removePlugin, togglePlugin, formatPluginList
} from './plugin';

export function registerPluginCommands(program: Command, vaultPath: string): void {
  const plugin = program.command('plugin').description('Manage vault plugins');

  plugin
    .command('add <name> <version> <description> <entrypoint>')
    .description('Install a plugin')
    .action((name, version, description, entrypoint) => {
      const p = getPluginPath(vaultPath);
      const store = loadPlugins(p);
      const updated = addPlugin(store, { name, version, description, entrypoint });
      savePlugins(p, updated);
      console.log(`Plugin '${name}' installed.`);
    });

  plugin
    .command('remove <name>')
    .description('Uninstall a plugin')
    .action((name) => {
      const p = getPluginPath(vaultPath);
      const store = loadPlugins(p);
      const updated = removePlugin(store, name);
      savePlugins(p, updated);
      console.log(`Plugin '${name}' removed.`);
    });

  plugin
    .command('enable <name>')
    .action((name) => {
      const p = getPluginPath(vaultPath);
      savePlugins(p, togglePlugin(loadPlugins(p), name, true));
      console.log(`Plugin '${name}' enabled.`);
    });

  plugin
    .command('disable <name>')
    .action((name) => {
      const p = getPluginPath(vaultPath);
      savePlugins(p, togglePlugin(loadPlugins(p), name, false));
      console.log(`Plugin '${name}' disabled.`);
    });

  plugin
    .command('list')
    .description('List installed plugins')
    .action(() => {
      const p = getPluginPath(vaultPath);
      console.log(formatPluginList(loadPlugins(p)));
    });
}
