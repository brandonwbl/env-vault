import { Command } from 'commander';
import { readVault, deserializeVault } from '../crypto/vault';
import { loadQuota, setQuota, checkQuota, formatQuota } from './quota';

export function registerQuotaCommands(program: Command): void {
  const quota = program
    .command('quota')
    .description('Manage vault quota limits');

  quota
    .command('show <vaultPath>')
    .description('Show current quota configuration')
    .action((vaultPath: string) => {
      const store = loadQuota(vaultPath);
      console.log(formatQuota(store));
    });

  quota
    .command('set <vaultPath>')
    .description('Set quota limits for a vault')
    .option('--max-keys <n>', 'Maximum number of keys', parseInt)
    .option('--max-value-length <n>', 'Maximum value length in characters', parseInt)
    .option('--max-total-size <n>', 'Maximum total vault size in bytes', parseInt)
    .action((vaultPath: string, opts) => {
      const updates: Record<string, number> = {};
      if (opts.maxKeys !== undefined) updates.maxKeys = opts.maxKeys;
      if (opts.maxValueLength !== undefined) updates.maxValueLength = opts.maxValueLength;
      if (opts.maxTotalSize !== undefined) updates.maxTotalSize = opts.maxTotalSize;
      const store = setQuota(vaultPath, updates);
      console.log('Quota updated.');
      console.log(formatQuota(store));
    });

  quota
    .command('check <vaultPath> <password>')
    .description('Check vault entries against quota limits')
    .action(async (vaultPath: string, password: string) => {
      const raw = readVault(vaultPath);
      const vault = await deserializeVault(raw, password);
      const entries: Record<string, string> = {};
      for (const e of vault.entries) {
        entries[e.key] = e.value;
      }
      const store = loadQuota(vaultPath);
      const result = checkQuota(entries, store.config);
      console.log(formatQuota(store, result));
      if (!result.passed) process.exit(1);
    });
}
