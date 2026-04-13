import * as fs from 'fs';
import * as path from 'path';
import { readVault, writeVault } from '../crypto/vault';
import { VaultEntry } from '../crypto/vault';

export interface Snapshot {
  id: string;
  label: string;
  createdAt: string;
  entries: VaultEntry[];
}

export function getSnapshotDir(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `.${base}-snapshots`);
}

export function listSnapshots(vaultPath: string): Snapshot[] {
  const dir = getSnapshotDir(vaultPath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Snapshot)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createSnapshot(
  vaultPath: string,
  password: string,
  label: string
): Promise<Snapshot> {
  const vault = await readVault(vaultPath, password);
  const dir = getSnapshotDir(vaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const id = `snap_${Date.now()}`;
  const snapshot: Snapshot = {
    id,
    label,
    createdAt: new Date().toISOString(),
    entries: vault.entries,
  };

  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(snapshot, null, 2));
  return snapshot;
}

export async function restoreSnapshot(
  vaultPath: string,
  password: string,
  snapshotId: string
): Promise<void> {
  const dir = getSnapshotDir(vaultPath);
  const snapFile = path.join(dir, `${snapshotId}.json`);
  if (!fs.existsSync(snapFile)) throw new Error(`Snapshot '${snapshotId}' not found`);

  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapFile, 'utf-8'));
  const vault = await readVault(vaultPath, password);
  vault.entries = snapshot.entries;
  await writeVault(vaultPath, password, vault);
}

export function deleteSnapshot(vaultPath: string, snapshotId: string): void {
  const dir = getSnapshotDir(vaultPath);
  const snapFile = path.join(dir, `${snapshotId}.json`);
  if (!fs.existsSync(snapFile)) throw new Error(`Snapshot '${snapshotId}' not found`);
  fs.unlinkSync(snapFile);
}

export function formatSnapshotList(snapshots: Snapshot[]): string {
  if (snapshots.length === 0) return 'No snapshots found.';
  return snapshots
    .map(s => `[${s.id}] ${s.label} — ${new Date(s.createdAt).toLocaleString()} (${s.entries.length} entries)`)
    .join('\n');
}
