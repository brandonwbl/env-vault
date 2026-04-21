import { Command } from 'commander';
import {
  getRateLimitPath,
  loadRateLimitStore,
  saveRateLimitStore,
  addRule,
  removeRule,
  checkRateLimit,
  formatRateLimitList,
} from './rate-limit';

export function registerRateLimitCommands(program: Command, vaultPath: string): void {
  const rl = program.command('rate-limit').description('Manage rate limit rules for vault operations');

  rl.command('add <key> <maxRequests> <windowSeconds>')
    .description('Add or update a rate limit rule for a key')
    .action((key: string, maxRequestsStr: string, windowSecondsStr: string) => {
      const maxRequests = parseInt(maxRequestsStr, 10);
      const windowSeconds = parseInt(windowSecondsStr, 10);
      if (isNaN(maxRequests) || isNaN(windowSeconds) || maxRequests <= 0 || windowSeconds <= 0) {
        console.error('maxRequests and windowSeconds must be positive integers.');
        process.exit(1);
      }
      const storePath = getRateLimitPath(vaultPath);
      const store = loadRateLimitStore(storePath);
      const updated = addRule(store, { key, maxRequests, windowSeconds });
      saveRateLimitStore(storePath, updated);
      console.log(`Rate limit set: ${key} → ${maxRequests} req / ${windowSeconds}s`);
    });

  rl.command('remove <key>')
    .description('Remove a rate limit rule')
    .action((key: string) => {
      const storePath = getRateLimitPath(vaultPath);
      const store = loadRateLimitStore(storePath);
      const updated = removeRule(store, key);
      saveRateLimitStore(storePath, updated);
      console.log(`Rate limit rule removed for: ${key}`);
    });

  rl.command('list')
    .description('List all rate limit rules')
    .action(() => {
      const storePath = getRateLimitPath(vaultPath);
      const store = loadRateLimitStore(storePath);
      console.log(formatRateLimitList(store));
    });

  rl.command('check <key>')
    .description('Check current rate limit status for a key')
    .action((key: string) => {
      const storePath = getRateLimitPath(vaultPath);
      const store = loadRateLimitStore(storePath);
      const result = checkRateLimit(store, key);
      const status = result.allowed ? 'ALLOWED' : 'BLOCKED';
      const reset = result.resetAt ? new Date(result.resetAt).toISOString() : 'N/A';
      console.log(`Status: ${status}`);
      console.log(`Remaining: ${result.remaining}`);
      console.log(`Reset at: ${reset}`);
    });
}
