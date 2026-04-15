import { Command } from 'commander';
import {
  getNamespacePath,
  loadNamespaces,
  saveNamespaces,
  addNamespace,
  removeNamespace,
  switchNamespace,
  formatNamespaceList,
} from './namespace';

export function registerNamespaceCommands(program: Command, vaultPath: string): void {
  const ns = program.command('namespace').description('Manage vault namespaces');

  ns.command('list')
    .description('List all namespaces')
    .action(() => {
      const nsPath = getNamespacePath(vaultPath);
      const store = loadNamespaces(nsPath);
      console.log(formatNamespaceList(store));
    });

  ns.command('add <name>')
    .description('Add a new namespace')
    .action((name: string) => {
      const nsPath = getNamespacePath(vaultPath);
      const store = loadNamespaces(nsPath);
      const updated = addNamespace(store, name);
      saveNamespaces(nsPath, updated);
      console.log(`Namespace "${name}" added.`);
    });

  ns.command('remove <name>')
    .description('Remove a namespace')
    .action((name: string) => {
      const nsPath = getNamespacePath(vaultPath);
      const store = loadNamespaces(nsPath);
      const updated = removeNamespace(store, name);
      saveNamespaces(nsPath, updated);
      console.log(`Namespace "${name}" removed.`);
    });

  ns.command('switch <name>')
    .description('Switch active namespace')
    .action((name: string) => {
      const nsPath = getNamespacePath(vaultPath);
      const store = loadNamespaces(nsPath);
      const updated = switchNamespace(store, name);
      saveNamespaces(nsPath, updated);
      console.log(`Switched to namespace "${name}".`);
    });

  ns.command('current')
    .description('Show the active namespace')
    .action(() => {
      const nsPath = getNamespacePath(vaultPath);
      const store = loadNamespaces(nsPath);
      console.log(store.active ?? 'default');
    });
}
