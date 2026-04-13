import { readVault, writeVault } from '../crypto';
import { Command } from 'commander';

export interface PinnedEntry {
  key: string;
  pinnedAt: string;
  note?: string;
}

export function getPinnedEntries(vault: any): PinnedEntry[] {
  return vault.meta?.pinned ?? [];
}

export function pinEntry(
  vault: any,
  key: string,
  note?: string
): { vault: any; alreadyPinned: boolean } {
  const pinned: PinnedEntry[] = getPinnedEntries(vault);
  if (pinned.some((p) => p.key === key)) {
    return { vault, alreadyPinned: true };
  }
  const entry: PinnedEntry = { key, pinnedAt: new Date().toISOString() };
  if (note) entry.note = note;
  const updatedVault = {
    ...vault,
    meta: { ...vault.meta, pinned: [...pinned, entry] },
  };
  return { vault: updatedVault, alreadyPinned: false };
}

export function unpinEntry(
  vault: any,
  key: string
): { vault: any; wasFound: boolean } {
  const pinned: PinnedEntry[] = getPinnedEntries(vault);
  const filtered = pinned.filter((p) => p.key !== key);
  if (filtered.length === pinned.length) {
    return { vault, wasFound: false };
  }
  const updatedVault = {
    ...vault,
    meta: { ...vault.meta, pinned: filtered },
  };
  return { vault: updatedVault, wasFound: true };
}

export function formatPinnedList(pinned: PinnedEntry[]): string {
  if (pinned.length === 0) return 'No pinned entries.';
  return pinned
    .map((p) => {
      const note = p.note ? `  # ${p.note}` : '';
      return `  ${p.key}  (pinned ${p.pinnedAt})${note}`;
    })
    .join('\n');
}

export function registerPinCommands(
  program: Command,
  vaultPath: string,
  password: string
): void {
  const pin = program.command('pin').description('Manage pinned vault entries');

  pin
    .command('add <key>')
    .option('-n, --note <note>', 'Optional note for the pin')
    .description('Pin an entry by key')
    .action(async (key: string, opts: { note?: string }) => {
      const vault = await readVault(vaultPath, password);
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
    .description('Unpin an entry by key')
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
}
