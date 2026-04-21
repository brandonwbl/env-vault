import { Command } from 'commander';
import { getScopePath, loadScopes, saveScopes, addScope, removeScope, setActiveScope, clearActiveScope, formatScopeList } from './scope';

export function registerScopeCommands(program: Command, vaultPath: string): void {
  const scope = program.command('scope').description('Manage entry scopes');

  scope
    .command('add <name> <keys...>')
    .description('Create a new scope with the given keys')
    .option('-d, --description <desc>', 'Optional description')
    .action((name: string, keys: string[], opts: { description?: string }) => {
      const scopePath = getScopePath(vaultPath);
      const store = loadScopes(scopePath);
      const updated = addScope(store, name, keys, opts.description);
      saveScopes(scopePath, updated);
      console.log(`Scope "${name}" created with keys: ${keys.join(', ')}`);
    });

  scope
    .command('remove <name>')
    .description('Remove an existing scope')
    .action((name: string) => {
      const scopePath = getScopePath(vaultPath);
      const store = loadScopes(scopePath);
      const updated = removeScope(store, name);
      saveScopes(scopePath, updated);
      console.log(`Scope "${name}" removed.`);
    });

  scope
    .command('use <name>')
    .description('Set the active scope')
    .action((name: string) => {
      const scopePath = getScopePath(vaultPath);
      const store = loadScopes(scopePath);
      const updated = setActiveScope(store, name);
      saveScopes(scopePath, updated);
      console.log(`Active scope set to "${name}".`);
    });

  scope
    .command('clear')
    .description('Clear the active scope')
    .action(() => {
      const scopePath = getScopePath(vaultPath);
      const store = loadScopes(scopePath);
      const updated = clearActiveScope(store);
      saveScopes(scopePath, updated);
      console.log('Active scope cleared.');
    });

  scope
    .command('list')
    .description('List all scopes')
    .action(() => {
      const scopePath = getScopePath(vaultPath);
      const store = loadScopes(scopePath);
      console.log(formatScopeList(store));
    });
}
