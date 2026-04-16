import { Command } from 'commander';
import {
  getEnvGroupPath,
  loadEnvGroups,
  saveEnvGroups,
  addGroup,
  removeGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  formatGroupList,
} from './env-group';

export function registerEnvGroupCommands(program: Command): void {
  const group = program
    .command('group')
    .description('Manage named groups of environment variable keys');

  group
    .command('create <name> [keys...]')
    .description('Create a new group with optional keys')
    .option('-d, --description <desc>', 'Group description')
    .option('-v, --vault <path>', 'Vault path', 'vault.enc')
    .action((name: string, keys: string[], opts: { description?: string; vault: string }) => {
      const gp = getEnvGroupPath(opts.vault);
      const store = loadEnvGroups(gp);
      addGroup(store, name, keys, opts.description);
      saveEnvGroups(gp, store);
      console.log(`Group '${name}' created with ${keys.length} key(s).`);
    });

  group
    .command('delete <name>')
    .description('Delete a group')
    .option('-v, --vault <path>', 'Vault path', 'vault.enc')
    .action((name: string, opts: { vault: string }) => {
      const gp = getEnvGroupPath(opts.vault);
      const store = loadEnvGroups(gp);
      removeGroup(store, name);
      saveEnvGroups(gp, store);
      console.log(`Group '${name}' deleted.`);
    });

  group
    .command('add-key <name> <key>')
    .description('Add a key to an existing group')
    .option('-v, --vault <path>', 'Vault path', 'vault.enc')
    .action((name: string, key: string, opts: { vault: string }) => {
      const gp = getEnvGroupPath(opts.vault);
      const store = loadEnvGroups(gp);
      addKeyToGroup(store, name, key);
      saveEnvGroups(gp, store);
      console.log(`Key '${key}' added to group '${name}'.`);
    });

  group
    .command('remove-key <name> <key>')
    .description('Remove a key from a group')
    .option('-v, --vault <path>', 'Vault path', 'vault.enc')
    .action((name: string, key: string, opts: { vault: string }) => {
      const gp = getEnvGroupPath(opts.vault);
      const store = loadEnvGroups(gp);
      removeKeyFromGroup(store, name, key);
      saveEnvGroups(gp, store);
      console.log(`Key '${key}' removed from group '${name}'.`);
    });

  group
    .command('list')
    .description('List all groups')
    .option('-v, --vault <path>', 'Vault path', 'vault.enc')
    .action((opts: { vault: string }) => {
      const gp = getEnvGroupPath(opts.vault);
      const store = loadEnvGroups(gp);
      console.log(formatGroupList(store));
    });
}
