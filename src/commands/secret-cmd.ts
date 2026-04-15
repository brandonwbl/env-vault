import { Command } from 'commander';
import {
  maskKey,
  unmaskKey,
  loadSecretStore,
  formatSecretList,
} from './secret';

export function registerSecretCommands(program: Command, vaultPath: string): void {
  const secret = program
    .command('secret')
    .description('Manage secret masking for sensitive keys');

  secret
    .command('mask <key>')
    .description('Mark a key as secret (masked in output)')
    .option('--preview', 'Show partial value instead of full mask', false)
    .action((key: string, opts: { preview: boolean }) => {
      maskKey(vaultPath, key, opts.preview);
      console.log(`Key "${key}" is now masked${opts.preview ? ' (preview mode)' : ''}.`);
    });

  secret
    .command('unmask <key>')
    .description('Remove masking from a key')
    .action((key: string) => {
      unmaskKey(vaultPath, key);
      console.log(`Key "${key}" is no longer masked.`);
    });

  secret
    .command('list')
    .description('List all masked keys')
    .action(() => {
      const store = loadSecretStore(vaultPath);
      console.log(formatSecretList(store));
    });
}
