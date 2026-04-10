import { readVault, deserializeVault } from '../crypto';
import { serializeEnv } from '../env';

export interface DiffResult {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
}

export async function diffVaults(
  vaultPathA: string,
  vaultPathB: string,
  passwordA: string,
  passwordB?: string
): Promise<DiffResult> {
  const rawA = await readVault(vaultPathA);
  const rawB = await readVault(vaultPathB);

  const vaultA = await deserializeVault(rawA, passwordA);
  const vaultB = await deserializeVault(rawB, passwordB ?? passwordA);

  const keysA = new Set(Object.keys(vaultA.variables));
  const keysB = new Set(Object.keys(vaultB.variables));

  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};

  for (const key of keysB) {
    if (!keysA.has(key)) {
      added[key] = vaultB.variables[key];
    } else if (vaultA.variables[key] !== vaultB.variables[key]) {
      changed[key] = { from: vaultA.variables[key], to: vaultB.variables[key] };
    }
  }

  for (const key of keysA) {
    if (!keysB.has(key)) {
      removed[key] = vaultA.variables[key];
    }
  }

  return { added, removed, changed };
}

export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(diff.added)) {
    lines.push(`+ ${key}=${value}`);
  }

  for (const [key, value] of Object.entries(diff.removed)) {
    lines.push(`- ${key}=${value}`);
  }

  for (const [key, { from, to }] of Object.entries(diff.changed)) {
    lines.push(`~ ${key}: "${from}" → "${to}"`);
  }

  if (lines.length === 0) {
    return 'No differences found.';
  }

  return lines.join('\n');
}
