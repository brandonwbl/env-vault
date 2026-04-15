import * as fs from 'fs';
import * as path from 'path';
import { readVault, writeVault } from '../crypto/vault';
import { loadHistory, appendHistoryEntry } from './history';

export interface RollbackResult {
  rolledBackTo: string;
  keysRestored: number;
}

export function getCheckpointDir(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.checkpoints');
}

export function listCheckpoints(vaultPath: string): string[] {
  const dir = getCheckpointDir(vaultPath);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.checkpoint'))
    .sort()
    .reverse();
}

export async function saveCheckpoint(
  vaultPath: string,
  password: string
): Promise<string> {
  const dir = getCheckpointDir(vaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointFile = path.join(dir, `${timestamp}.checkpoint`);
  const vault = await readVault(vaultPath, password);
  fs.writeFileSync(checkpointFile, JSON.stringify(vault.entries), 'utf-8');
  return checkpointFile;
}

export async function rollbackToCheckpoint(
  vaultPath: string,
  password: string,
  checkpointFile: string
): Promise<RollbackResult> {
  if (!fs.existsSync(checkpointFile)) {
    throw new Error(`Checkpoint not found: ${checkpointFile}`);
  }
  const raw = fs.readFileSync(checkpointFile, 'utf-8');
  const entries: Record<string, string> = JSON.parse(raw);
  const vault = await readVault(vaultPath, password);
  vault.entries = entries;
  await writeVault(vaultPath, vault, password);
  const history = loadHistory(vaultPath);
  appendHistoryEntry(history, vaultPath, {
    action: 'rollback',
    key: checkpointFile,
    timestamp: new Date().toISOString(),
  });
  return {
    rolledBackTo: path.basename(checkpointFile),
    keysRestored: Object.keys(entries).length,
  };
}

export function formatRollbackResult(result: RollbackResult): string {
  return [
    `Rolled back to checkpoint: ${result.rolledBackTo}`,
    `Keys restored: ${result.keysRestored}`,
  ].join('\n');
}
