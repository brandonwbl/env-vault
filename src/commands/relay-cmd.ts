import { Command } from 'commander';
import {
  getRelayPath, loadRelayStore, saveRelayStore,
  addRelayTarget, removeRelayTarget, toggleRelayTarget, formatRelayList
} from './relay';
import { buildRelayPayload, sendToTarget, formatRelaySendResults } from './relay-utils';
import { readVault, deserializeVault } from '../crypto/vault';

export function registerRelayCommands(program: Command, vaultPath: string, password: string): void {
  const relay = program.command('relay').description('Manage relay targets for vault sync');

  relay.command('add <url> <secret>')
    .description('Add a relay target')
    .action((url, secret) => {
      const p = getRelayPath(vaultPath);
      const store = loadRelayStore(p);
      const target = addRelayTarget(store, url, secret);
      saveRelayStore(p, store);
      console.log(`Added relay target ${target.id}`);
    });

  relay.command('remove <id>')
    .description('Remove a relay target by id')
    .action((id) => {
      const p = getRelayPath(vaultPath);
      const store = loadRelayStore(p);
      const removed = removeRelayTarget(store, id);
      saveRelayStore(p, store);
      console.log(removed ? `Removed ${id}` : `Target ${id} not found`);
    });

  relay.command('enable <id>').action((id) => {
    const p = getRelayPath(vaultPath);
    const store = loadRelayStore(p);
    toggleRelayTarget(store, id, true);
    saveRelayStore(p, store);
    console.log(`Enabled ${id}`);
  });

  relay.command('disable <id>').action((id) => {
    const p = getRelayPath(vaultPath);
    const store = loadRelayStore(p);
    toggleRelayTarget(store, id, false);
    saveRelayStore(p, store);
    console.log(`Disabled ${id}`);
  });

  relay.command('list').action(() => {
    const store = loadRelayStore(getRelayPath(vaultPath));
    console.log(formatRelayList(store));
  });

  relay.command('push')
    .description('Push vault entries to all enabled relay targets')
    .action(async () => {
      const store = loadRelayStore(getRelayPath(vaultPath));
      const enabled = store.targets.filter(t => t.enabled);
      if (enabled.length === 0) { console.log('No enabled relay targets.'); return; }
      const raw = readVault(vaultPath);
      const vault = deserializeVault(raw);
      const payload = buildRelayPayload(vault.entries, vaultPath);
      const results = await Promise.all(enabled.map(t => sendToTarget(t, payload)));
      console.log(formatRelaySendResults(results));
    });
}
