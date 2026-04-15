import { Command } from 'commander';
import * as path from 'path';
import { startWatch } from './watch';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch a .env file and sync changes into the vault automatically')
    .argument('<envFile>', 'Path to the .env file to watch')
    .requiredOption('-v, --vault <path>', 'Path to the vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .option('-i, --interval <ms>', 'Polling interval in milliseconds', '1000')
    .action((envFile: string, opts: { vault: string; password: string; interval: string }) => {
      const vaultPath = path.resolve(opts.vault);
      const resolvedEnv = path.resolve(envFile);
      const interval = parseInt(opts.interval, 10);

      if (isNaN(interval) || interval <= 0) {
        console.error('Error: --interval must be a positive integer (milliseconds).');
        process.exit(1);
      }

      console.log(`Watching ${resolvedEnv} — syncing to vault ${vaultPath}`);
      console.log('Press Ctrl+C to stop.\n');

      const stop = startWatch(
        { vaultPath, envFile: resolvedEnv, password: opts.password, interval },
        (added, removed, updated) => {
          const ts = new Date().toLocaleTimeString();
          if (added.length) console.log(`[${ts}] Added:   ${added.join(', ')}`);
          if (updated.length) console.log(`[${ts}] Updated: ${updated.join(', ')}`);
          if (removed.length) console.log(`[${ts}] Removed: ${removed.join(', ')}`);
        },
        (err) => {
          console.error('Watch error:', err.message);
        }
      );

      process.on('SIGINT', () => {
        stop();
        console.log('\nWatch stopped.');
        process.exit(0);
      });
    });
}
