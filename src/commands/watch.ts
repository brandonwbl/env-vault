import * as fs from 'fs';
import * as path from 'path';
import { readVault, writeVault } from '../crypto/vault';
import { parseEnv } from '../env/parser';
import { appendHistoryEntry } from './history';

export interface WatchOptions {
  vaultPath: string;
  envFile: string;
  password: string;
  interval?: number;
}

export function startWatch(
  options: WatchOptions,
  onSync: (added: string[], removed: string[], updated: string[]) => void,
  onError: (err: Error) => void
): () => void {
  const { vaultPath, envFile, password, interval = 1000 } = options;

  let lastMtime = 0;

  const poll = async () => {
    try {
      if (!fs.existsSync(envFile)) return;
      const stat = fs.statSync(envFile);
      const mtime = stat.mtimeMs;
      if (mtime === lastMtime) return;
      lastMtime = mtime;

      const raw = fs.readFileSync(envFile, 'utf-8');
      const incoming = parseEnv(raw);

      const vault = await readVault(vaultPath, password);
      const existing = new Map(vault.entries.map((e) => [e.key, e.value]));

      const added: string[] = [];
      const updated: string[] = [];
      const removed: string[] = [];

      for (const [key, value] of Object.entries(incoming)) {
        if (!existing.has(key)) {
          added.push(key);
          vault.entries.push({ key, value, tags: [] });
        } else if (existing.get(key) !== value) {
          updated.push(key);
          const entry = vault.entries.find((e) => e.key === key)!;
          entry.value = value;
        }
      }

      for (const [key] of existing) {
        if (!(key in incoming)) {
          removed.push(key);
          vault.entries = vault.entries.filter((e) => e.key !== key);
        }
      }

      if (added.length || updated.length || removed.length) {
        await writeVault(vaultPath, password, vault);
        appendHistoryEntry(vaultPath, {
          action: 'watch-sync',
          keys: [...added, ...updated, ...removed],
          timestamp: new Date().toISOString(),
        });
        onSync(added, removed, updated);
      }
    } catch (err) {
      onError(err as Error);
    }
  };

  const timer = setInterval(poll, interval);
  return () => clearInterval(timer);
}
