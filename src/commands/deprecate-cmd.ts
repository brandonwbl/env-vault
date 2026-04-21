import { Command } from 'commander';
import {
  loadDeprecationStore,
  saveDeprecationStore,
  markDeprecated,
  unmarkDeprecated,
  formatDeprecationList,
  getDeprecation,
} from './deprecate';

export function registerDeprecateCommands(program: Command, vaultPath: string): void {
  const dep = program.command('deprecate').description('Manage deprecated keys in the vault');

  dep
    .command('mark <key>')
    .description('Mark a key as deprecated')
    .requiredOption('-r, --reason <reason>', 'Reason for deprecation')
    .option('--replaced-by <key>', 'Key that replaces this one')
    .action((key: string, opts: { reason: string; replacedBy?: string }) => {
      const store = loadDeprecationStore(vaultPath);
      const updated = markDeprecated(store, key, opts.reason, opts.replacedBy);
      saveDeprecationStore(vaultPath, updated);
      console.log(`Marked '${key}' as deprecated.`);
    });

  dep
    .command('unmark <key>')
    .description('Remove deprecation from a key')
    .action((key: string) => {
      const store = loadDeprecationStore(vaultPath);
      const updated = unmarkDeprecated(store, key);
      saveDeprecationStore(vaultPath, updated);
      console.log(`Removed deprecation for '${key}'.`);
    });

  dep
    .command('check <key>')
    .description('Check if a key is deprecated')
    .action((key: string) => {
      const store = loadDeprecationStore(vaultPath);
      const entry = getDeprecation(store, key);
      if (entry) {
        const repl = entry.replacedBy ? ` Use '${entry.replacedBy}' instead.` : '';
        console.log(`DEPRECATED: ${key} — ${entry.reason}.${repl}`);
      } else {
        console.log(`'${key}' is not deprecated.`);
      }
    });

  dep
    .command('list')
    .description('List all deprecated keys')
    .action(() => {
      const store = loadDeprecationStore(vaultPath);
      console.log(formatDeprecationList(store));
    });
}
