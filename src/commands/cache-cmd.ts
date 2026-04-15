import { Command } from 'commander';
import {
  loadCache,
  saveCache,
  setCacheEntry,
  getCacheEntry,
  evictExpired,
  clearCache,
  formatCacheList,
} from './cache';

export function registerCacheCommands(program: Command): void {
  const cache = program
    .command('cache')
    .description('Manage the local decrypted value cache');

  cache
    .command('set <vaultPath> <key> <value>')
    .description('Cache a decrypted value locally')
    .option('--ttl <seconds>', 'Time-to-live in seconds', parseInt)
    .action((vaultPath: string, key: string, value: string, opts) => {
      let store = loadCache(vaultPath);
      store = setCacheEntry(store, key, value, opts.ttl);
      saveCache(store);
      console.log(`Cached: ${key}`);
    });

  cache
    .command('get <vaultPath> <key>')
    .description('Retrieve a cached value')
    .action((vaultPath: string, key: string) => {
      const store = loadCache(vaultPath);
      const entry = getCacheEntry(store, key);
      if (!entry) {
        console.error(`Cache miss or expired: ${key}`);
        process.exit(1);
      }
      console.log(entry.value);
    });

  cache
    .command('list <vaultPath>')
    .description('List all active cached entries')
    .action((vaultPath: string) => {
      const store = loadCache(vaultPath);
      console.log(formatCacheList(store));
    });

  cache
    .command('evict <vaultPath>')
    .description('Remove expired entries from the cache')
    .action((vaultPath: string) => {
      let store = loadCache(vaultPath);
      const before = store.entries.length;
      store = evictExpired(store);
      const removed = before - store.entries.length;
      saveCache(store);
      console.log(`Evicted ${removed} expired entry(ies).`);
    });

  cache
    .command('clear <vaultPath>')
    .description('Clear all cached entries')
    .action((vaultPath: string) => {
      let store = loadCache(vaultPath);
      store = clearCache(store);
      saveCache(store);
      console.log('Cache cleared.');
    });
}
