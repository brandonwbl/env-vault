import { Command } from 'commander';
import { acquireLock, releaseLock, readLock, formatLockStatus } from './lock';
import * as os from 'os';

function currentUser(): string {
  return process.env.VAULT_USER || os.userInfo().username;
}

export function registerLockCommands(program: Command): void {
  const lock = program
    .command('lock')
    .description('Manage vault lock to prevent concurrent edits');

  lock
    .command('acquire <vault>')
    .description('Acquire a lock on the vault')
    .option('-u, --user <user>', 'User acquiring the lock (defaults to current OS user)')
    .action((vault: string, opts: { user?: string }) => {
      const user = opts.user || currentUser();
      try {
        acquireLock(vault, user);
        console.log(`Lock acquired on "${vault}" by "${user}".`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  lock
    .command('release <vault>')
    .description('Release the lock on the vault')
    .option('-u, --user <user>', 'User releasing the lock (defaults to current OS user)')
    .action((vault: string, opts: { user?: string }) => {
      const user = opts.user || currentUser();
      try {
        releaseLock(vault, user);
        console.log(`Lock released on "${vault}".`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  lock
    .command('status <vault>')
    .description('Show lock status of the vault')
    .action((vault: string) => {
      const info = readLock(vault);
      console.log(formatLockStatus(info));
    });
}
