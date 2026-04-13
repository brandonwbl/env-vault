import { Snapshot } from './snapshot';

export interface SnapshotDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export function diffSnapshots(from: Snapshot, to: Snapshot): SnapshotDiff {
  const fromMap = new Map(from.entries.map(e => [e.key, e.value]));
  const toMap = new Map(to.entries.map(e => [e.key, e.value]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [key, value] of toMap) {
    if (!fromMap.has(key)) added.push(key);
    else if (fromMap.get(key) !== value) changed.push(key);
  }

  for (const key of fromMap.keys()) {
    if (!toMap.has(key)) removed.push(key);
  }

  return { added, removed, changed };
}

export function formatSnapshotDiff(from: Snapshot, to: Snapshot, diff: SnapshotDiff): string {
  const lines: string[] = [
    `Diff: [${from.id}] ${from.label}  →  [${to.id}] ${to.label}`,
    '',
  ];

  if (diff.added.length > 0) {
    lines.push('Added:');
    diff.added.forEach(k => lines.push(`  + ${k}`));
  }
  if (diff.removed.length > 0) {
    lines.push('Removed:');
    diff.removed.forEach(k => lines.push(`  - ${k}`));
  }
  if (diff.changed.length > 0) {
    lines.push('Changed:');
    diff.changed.forEach(k => lines.push(`  ~ ${k}`));
  }
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    lines.push('No differences found.');
  }

  return lines.join('\n');
}

export function findSnapshotById(snapshots: Snapshot[], id: string): Snapshot | undefined {
  return snapshots.find(s => s.id === id);
}

export function findSnapshotByLabel(snapshots: Snapshot[], label: string): Snapshot | undefined {
  return snapshots.find(s => s.label === label);
}
