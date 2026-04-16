import { Command } from 'commander';
import {
  loadNotifyStore, saveNotifyStore,
  addChannel, removeChannel, toggleChannel,
  formatNotifyList, NotifyChannel
} from './notify';

export function registerNotifyCommands(program: Command, vaultPath: string): void {
  const notify = program.command('notify').description('Manage notification channels');

  notify
    .command('add <id> <type> <target>')
    .description('Add a notification channel (type: slack|email|webhook)')
    .option('--events <events>', 'Comma-separated events to listen for', '*')
    .action((id, type, target, opts) => {
      const store = loadNotifyStore(vaultPath);
      const channel: NotifyChannel = {
        id, type, target,
        events: opts.events.split(',').map((e: string) => e.trim()),
        enabled: true
      };
      saveNotifyStore(vaultPath, addChannel(store, channel));
      console.log(`Channel '${id}' added.`);
    });

  notify
    .command('remove <id>')
    .description('Remove a notification channel')
    .action((id) => {
      const store = loadNotifyStore(vaultPath);
      saveNotifyStore(vaultPath, removeChannel(store, id));
      console.log(`Channel '${id}' removed.`);
    });

  notify
    .command('enable <id>')
    .action((id) => {
      const store = loadNotifyStore(vaultPath);
      saveNotifyStore(vaultPath, toggleChannel(store, id, true));
      console.log(`Channel '${id}' enabled.`);
    });

  notify
    .command('disable <id>')
    .action((id) => {
      const store = loadNotifyStore(vaultPath);
      saveNotifyStore(vaultPath, toggleChannel(store, id, false));
      console.log(`Channel '${id}' disabled.`);
    });

  notify
    .command('list')
    .description('List all notification channels')
    .action(() => {
      const store = loadNotifyStore(vaultPath);
      console.log(formatNotifyList(store));
    });
}
