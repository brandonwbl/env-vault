import { readVault, deserializeVault } from '../crypto';
import { VaultEntry } from '../crypto/vault';

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  different: { key: string; valueA: string; valueB: string }[];
  identical: string[];
}

export function compareEntries(
  entriesA: VaultEntry[],
  entriesB: VaultEntry[]
): CompareResult {
  const mapA = new Map(entriesA.map((e) => [e.key, e.value]));
  const mapB = new Map(entriesB.map((e) => [e.key, e.value]));

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const different: { key: string; valueA: string; valueB: string }[] = [];
  const identical: string[] = [];

  for (const [key, valueA] of mapA) {
    if (!mapB.has(key)) {
      onlyInA.push(key);
    } else if (mapB.get(key) !== valueA) {
      different.push({ key, valueA, valueB: mapB.get(key)! });
    } else {
      identical.push(key);
    }
  }

  for (const key of mapB.keys()) {
    if (!mapA.has(key)) {
      onlyInB.push(key);
    }
  }

  return { onlyInA, onlyInB, different, identical };
}

export function formatCompare(result: CompareResult, pathA: string, pathB: string): string {
  const lines: string[] = [`Comparing ${pathA} <-> ${pathB}`, ''];

  if (result.onlyInA.length > 0) {
    lines.push(`Only in ${pathA}:`);
    result.onlyInA.forEach((k) => lines.push(`  - ${k}`));
    lines.push('');
  }

  if (result.onlyInB.length > 0) {
    lines.push(`Only in ${pathB}:`);
    result.onlyInB.forEach((k) => lines.push(`  + ${k}`));
    lines.push('');
  }

  if (result.different.length > 0) {
    lines.push('Different values:');
    result.different.forEach(({ key, valueA, valueB }) => {
      lines.push(`  ~ ${key}`);
      lines.push(`      A: ${valueA}`);
      lines.push(`      B: ${valueB}`);
    });
    lines.push('');
  }

  lines.push(`Identical: ${result.identical.length} key(s)`);
  return lines.join('\n');
}

export async function compareCommand(
  vaultPathA: string,
  passwordA: string,
  vaultPathB: string,
  passwordB: string
): Promise<string> {
  const rawA = await readVault(vaultPathA);
  const vaultA = await deserializeVault(rawA, passwordA);

  const rawB = await readVault(vaultPathB);
  const vaultB = await deserializeVault(rawB, passwordB);

  const result = compareEntries(vaultA.entries, vaultB.entries);
  return formatCompare(result, vaultPathA, vaultPathB);
}
