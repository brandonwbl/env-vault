import * as fs from 'fs';
import * as path from 'path';
import { readVault } from '../crypto';

export interface HistoryEntry {
  timestamp: string;
  action: string;
  key: string;
  oldValue?: string;
  newValue?: string;
}

export interface VaultHistory {
  entries: HistoryEntry[];
}

export function getHistoryPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.history.json`);
}

export function loadHistory(vaultPath: string): VaultHistory {
  const historyPath = getHistoryPath(vaultPath);
  if (!fs.existsSync(historyPath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(historyPath, 'utf-8');
  return JSON.parse(raw) as VaultHistory;
}

export function saveHistory(vaultPath: string, history: VaultHistory): void {
  const historyPath = getHistoryPath(vaultPath);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

export function appendHistoryEntry(
  vaultPath: string,
  entry: Omit<HistoryEntry, 'timestamp'>
): void {
  const history = loadHistory(vaultPath);
  history.entries.push({ ...entry, timestamp: new Date().toISOString() });
  saveHistory(vaultPath, history);
}

export function formatHistory(entries: HistoryEntry[]): string {
  if (entries.length === 0) return 'No history found.';
  return entries
    .map((e) => {
      const change =
        e.action === 'set'
          ? `${e.key}=${e.newValue ?? ''} (was: ${e.oldValue ?? '<unset>'})`
          : e.action === 'remove'
          ? `${e.key} (was: ${e.oldValue ?? '<unset>'})`
          : e.key;
      return `[${e.timestamp}] ${e.action.toUpperCase()} ${change}`;
    })
    .join('\n');
}

export async function historyCommand(
  vaultPath: string,
  password: string,
  options: { key?: string; limit?: number } = {}
): Promise<string> {
  await readVault(vaultPath, password);
  const history = loadHistory(vaultPath);
  let entries = history.entries;
  if (options.key) {
    entries = entries.filter((e) => e.key === options.key);
  }
  if (options.limit && options.limit > 0) {
    entries = entries.slice(-options.limit);
  }
  return formatHistory(entries);
}
