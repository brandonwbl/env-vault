import { readVault, deserializeVault } from '../crypto';

export interface VaultInspectResult {
  path: string;
  entryCount: number;
  keys: string[];
  createdAt?: string;
  algorithm: string;
  saltLength: number;
  ivLength: number;
}

export async function inspectVault(
  vaultPath: string,
  password: string
): Promise<VaultInspectResult> {
  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);

  const keys = Object.keys(vault.data);

  return {
    path: vaultPath,
    entryCount: keys.length,
    keys,
    createdAt: vault.meta?.createdAt,
    algorithm: 'AES-256-GCM',
    saltLength: 32,
    ivLength: 16,
  };
}

export function formatInspect(result: VaultInspectResult): string {
  const lines: string[] = [];

  lines.push(`Vault: ${result.path}`);
  lines.push(`Algorithm: ${result.algorithm}`);
  lines.push(`Salt length: ${result.saltLength} bytes`);
  lines.push(`IV length: ${result.ivLength} bytes`);
  if (result.createdAt) {
    lines.push(`Created at: ${result.createdAt}`);
  }
  lines.push(`Entries: ${result.entryCount}`);

  if (result.entryCount > 0) {
    lines.push('Keys:');
    result.keys.forEach((key) => lines.push(`  - ${key}`));
  } else {
    lines.push('No entries found.');
  }

  return lines.join('\n');
}
