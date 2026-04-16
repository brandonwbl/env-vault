import { Command } from 'commander';
import { setExpiry, removeExpiry, loadExpiryStore, getExpiredKeys, formatExpiryList } from './expiry';
import { readVault, writeVault } from '../crypto/vault';

export function registerExpiryCommands(program: Command, vaultPath: string, password: string): void {
  const expiry = program.command('expiry').description('Manage key expiry dates');

  expiry
    .command('set <key> <date>')
    .description('Set expiry date for a key (ISO date or parseable string)')
    .action((key: string, date: string) => {
      const expiresAt = new Date(date);
      if (isNaN(expiresAt.getTime())) {
        console.error('Invalid date:', date);
        process.exit(1);
      }
      setExpiry(vaultPath, key, expiresAt);
      console.log(`Expiry set for "${key}": ${expiresAt.toISOString()}`);
    });

  expiry
    .command('remove <key>')
    .description('Remove expiry for a key')
    .action((key: string) => {
      removeExpiry(vaultPath, key);
      console.log(`Expiry removed for "${key}"`);
    });

  expiry
    .command('list')
    .description('List all expiry entries')
    .action(() => {
      const store = loadExpiryStore(vaultPath);
      console.log(formatExpiryList(store));
    });

  expiry
    .command('purge')
    .description('Remove expired keys from the vault')
    .action(async () => {
      const expired = getExpiredKeys(vaultPath);
      if (expired.length === 0) { console.log('No expired keys.'); return; }
      const vault = await readVault(vaultPath, password);
      expired.forEach(k => {
        delete vault.entries[k];
        removeExpiry(vaultPath, k);
      });
      await writeVault(vaultPath, password, vault);
      console.log(`Purged ${expired.length} expired key(s): ${expired.join(', ')}`);
    });
}
