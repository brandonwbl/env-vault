import { readVault, deserializeVault } from '../crypto';
import { VaultEntry } from '../crypto/vault';

export interface VaultStats {
  totalKeys: number;
  taggedKeys: number;
  untaggedKeys: number;
  uniqueTags: string[];
  avgValueLength: number;
  shortestKey: string | null;
  longestKey: string | null;
}

export function computeStats(entries: VaultEntry[]): VaultStats {
  if (entries.length === 0) {
    return {
      totalKeys: 0,
      taggedKeys: 0,
      untaggedKeys: 0,
      uniqueTags: [],
      avgValueLength: 0,
      shortestKey: null,
      longestKey: null,
    };
  }

  const tagSet = new Set<string>();
  let taggedKeys = 0;
  let totalValueLength = 0;
  let shortestKey = entries[0].key;
  let longestKey = entries[0].key;

  for (const entry of entries) {
    if (entry.tags && entry.tags.length > 0) {
      taggedKeys++;
      entry.tags.forEach((t) => tagSet.add(t));
    }
    totalValueLength += entry.value.length;
    if (entry.key.length < shortestKey.length) shortestKey = entry.key;
    if (entry.key.length > longestKey.length) longestKey = entry.key;
  }

  return {
    totalKeys: entries.length,
    taggedKeys,
    untaggedKeys: entries.length - taggedKeys,
    uniqueTags: Array.from(tagSet).sort(),
    avgValueLength: Math.round(totalValueLength / entries.length),
    shortestKey,
    longestKey,
  };
}

export function formatStats(stats: VaultStats): string {
  const lines = [
    `Total keys     : ${stats.totalKeys}`,
    `Tagged keys    : ${stats.taggedKeys}`,
    `Untagged keys  : ${stats.untaggedKeys}`,
    `Unique tags    : ${stats.uniqueTags.length > 0 ? stats.uniqueTags.join(', ') : '(none)'}`,
    `Avg value len  : ${stats.avgValueLength} chars`,
    `Shortest key   : ${stats.shortestKey ?? '(none)'}`,
    `Longest key    : ${stats.longestKey ?? '(none)'}`,
  ];
  return lines.join('\n');
}

export async function statsCommand(vaultPath: string, password: string): Promise<string> {
  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);
  const stats = computeStats(vault.entries);
  return formatStats(stats);
}
