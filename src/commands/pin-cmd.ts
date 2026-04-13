import { Command } from 'commander';
import { readVault, writeVault } from '../crypto';
import { getPinnedEntries, pinEntry, unpinEntry, formatPinnedList } from './pin';

export function buildPinProgram(vaultPath: string, password: string): Command {
  const program = new Command();

  const pin = program.command('pin').description('Manage pinned vault entries');

  pin
    .command('add <key>')
    .option('-n, --note <note>', 'Optional note for the pin')
    .description('Pin an entry so it is highlighted and protected from bulk operations')
    .action(async (key: string, opts: { note?: string }) => {
      const vault = await readVault(vaultPath, password);
      if (!Object.prototype.hasOwnProperty.call(vault.entries ?? {}, key)) {
        console.error(`Key "${key}" not found in vault.`);
        process.exitCode = 1;
        return;
      }
      const { vault: updated, alreadyPinned } = pinEntry(vault, key, opts.note);
      if (alreadyPinned) {
        console.log(`Entry "${key}" is already pinned.`);
        return;
      }
      await writeVault(vaultPath, password, updated);
      console.log(`Pinned "${key}".`);
    });

  pin
    .command('remove <key>')
    .description('Unpin an entry')
    .action(async (key: string) => {
      const vault = await readVault(vaultPath, password);
      const { vault: updated, wasFound } = unpinEntry(vault, key);
      if (!wasFound) {
        console.log(`Entry "${key}" was not pinned.`);
        return;
      }
      await writeVault(vaultPath, password, updated);
      console.log(`Unpinned "${key}".`);
    });

  pin
    .command('list')
    .description('List all pinned entries')
    .action(async () => {
      const vault = await readVault(vaultPath, password);
      const pinned = getPinnedEntries(vault);
      console.log(formatPinnedList(pinned));
    });

  return program;
}
