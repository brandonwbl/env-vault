export interface WatchSyncSummary {
  added: string[];
  removed: string[];
  updated: string[];
  timestamp: string;
}

export function formatWatchSyncSummary(summary: WatchSyncSummary): string {
  const lines: string[] = [`[${summary.timestamp}] Sync summary:`];
  if (summary.added.length) {
    lines.push(`  + Added   (${summary.added.length}): ${summary.added.join(', ')}`);
  }
  if (summary.updated.length) {
    lines.push(`  ~ Updated (${summary.updated.length}): ${summary.updated.join(', ')}`);
  }
  if (summary.removed.length) {
    lines.push(`  - Removed (${summary.removed.length}): ${summary.removed.join(', ')}`);
  }
  if (!summary.added.length && !summary.updated.length && !summary.removed.length) {
    lines.push('  No changes.');
  }
  return lines.join('\n');
}

export function buildSyncSummary(
  added: string[],
  removed: string[],
  updated: string[]
): WatchSyncSummary {
  return {
    added,
    removed,
    updated,
    timestamp: new Date().toISOString(),
  };
}

export function hasSyncChanges(summary: WatchSyncSummary): boolean {
  return summary.added.length > 0 || summary.removed.length > 0 || summary.updated.length > 0;
}
