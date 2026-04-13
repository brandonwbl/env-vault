import { Command } from 'commander';
import {
  createSnapshot,
  restoreSnapshot,
  listSnapshots,
  deleteSnapshot,
  formatSnapshotList,
} from './snapshot';
import { appendHistoryEntry } from './history';

export function registerSnapshotCommands(program: Command): void {
  const snap = program.command('snapshot').description('Manage vault snapshots');

  snap
    .command('create <label>')
    .description('Create a named snapshot of the current vault state')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .action(async (label: string, opts) => {
      try {
        const snapshot = await createSnapshot(opts.vault, opts.password, label);
        await appendHistoryEntry(opts.vault, { action: 'snapshot-create', key: label, timestamp: snapshot.createdAt });
        console.log(`Snapshot created: [${snapshot.id}] ${label}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  snap
    .command('list')
    .description('List all snapshots for a vault')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .action((opts) => {
      const snapshots = listSnapshots(opts.vault);
      console.log(formatSnapshotList(snapshots));
    });

  snap
    .command('restore <id>')
    .description('Restore vault to a previous snapshot')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .action(async (id: string, opts) => {
      try {
        await restoreSnapshot(opts.vault, opts.password, id);
        await appendHistoryEntry(opts.vault, { action: 'snapshot-restore', key: id, timestamp: new Date().toISOString() });
        console.log(`Vault restored from snapshot: ${id}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  snap
    .command('delete <id>')
    .description('Delete a snapshot')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .action((id: string, opts) => {
      try {
        deleteSnapshot(opts.vault, id);
        console.log(`Snapshot deleted: ${id}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
