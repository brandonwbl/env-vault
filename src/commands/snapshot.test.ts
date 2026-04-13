import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  restoreSnapshot,
  listSnapshots,
  deleteSnapshot,
  formatSnapshotList,
  getSnapshotDir,
} from './snapshot';
import { createVault, writeVault } from '../crypto/vault';

const password = 'test-password';
let tmpDir: string;
let vaultPath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  const vault = createVault();
  vault.entries.push({ key: 'FOO', value: 'bar', tags: [] });
  await writeVault(vaultPath, password, vault);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createSnapshot saves a snapshot file', async () => {
  const snap = await createSnapshot(vaultPath, password, 'initial');
  expect(snap.label).toBe('initial');
  expect(snap.entries).toHaveLength(1);
  const dir = getSnapshotDir(vaultPath);
  expect(fs.existsSync(path.join(dir, `${snap.id}.json`))).toBe(true);
});

test('listSnapshots returns created snapshots sorted by date', async () => {
  await createSnapshot(vaultPath, password, 'first');
  await createSnapshot(vaultPath, password, 'second');
  const snaps = listSnapshots(vaultPath);
  expect(snaps).toHaveLength(2);
  expect(snaps[0].label).toBe('first');
});

test('restoreSnapshot replaces vault entries', async () => {
  const snap = await createSnapshot(vaultPath, password, 'before-change');
  const vault = await (await import('../crypto/vault')).readVault(vaultPath, password);
  vault.entries.push({ key: 'NEW_KEY', value: 'new-value', tags: [] });
  await (await import('../crypto/vault')).writeVault(vaultPath, password, vault);

  await restoreSnapshot(vaultPath, password, snap.id);
  const restored = await (await import('../crypto/vault')).readVault(vaultPath, password);
  expect(restored.entries).toHaveLength(1);
  expect(restored.entries[0].key).toBe('FOO');
});

test('deleteSnapshot removes the snapshot file', async () => {
  const snap = await createSnapshot(vaultPath, password, 'to-delete');
  deleteSnapshot(vaultPath, snap.id);
  expect(listSnapshots(vaultPath)).toHaveLength(0);
});

test('deleteSnapshot throws for unknown id', () => {
  expect(() => deleteSnapshot(vaultPath, 'snap_nonexistent')).toThrow("Snapshot 'snap_nonexistent' not found");
});

test('formatSnapshotList returns no-snapshots message when empty', () => {
  expect(formatSnapshotList([])).toBe('No snapshots found.');
});

test('formatSnapshotList formats snapshots correctly', async () => {
  const snap = await createSnapshot(vaultPath, password, 'my-snap');
  const output = formatSnapshotList([snap]);
  expect(output).toContain('[snap_');
  expect(output).toContain('my-snap');
  expect(output).toContain('1 entries');
});
