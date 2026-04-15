import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getCheckpointDir,
  listCheckpoints,
  saveCheckpoint,
  rollbackToCheckpoint,
  formatRollbackResult,
} from './rollback';
import { createVault, writeVault } from '../crypto/vault';

const password = 'test-password';
let tmpDir: string;
let vaultPath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  const vault = createVault();
  vault.entries = { FOO: 'bar', BAZ: 'qux' };
  await writeVault(vaultPath, vault, password);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getCheckpointDir returns sibling .checkpoints directory', () => {
  const dir = getCheckpointDir(vaultPath);
  expect(dir).toBe(path.join(tmpDir, '.checkpoints'));
});

test('listCheckpoints returns empty array when no checkpoints exist', () => {
  const checkpoints = listCheckpoints(vaultPath);
  expect(checkpoints).toEqual([]);
});

test('saveCheckpoint creates a checkpoint file', async () => {
  const file = await saveCheckpoint(vaultPath, password);
  expect(fs.existsSync(file)).toBe(true);
  expect(file).toMatch(/\.checkpoint$/);
});

test('listCheckpoints returns saved checkpoint', async () => {
  await saveCheckpoint(vaultPath, password);
  const checkpoints = listCheckpoints(vaultPath);
  expect(checkpoints.length).toBe(1);
  expect(checkpoints[0]).toMatch(/\.checkpoint$/);
});

test('rollbackToCheckpoint restores entries from checkpoint', async () => {
  const checkpointFile = await saveCheckpoint(vaultPath, password);
  const { readVault, writeVault: wv } = await import('../crypto/vault');
  const vault = await readVault(vaultPath, password);
  vault.entries = { NEW_KEY: 'new_value' };
  await wv(vaultPath, vault, password);
  const result = await rollbackToCheckpoint(vaultPath, password, checkpointFile);
  expect(result.keysRestored).toBe(2);
  const restored = await readVault(vaultPath, password);
  expect(restored.entries['FOO']).toBe('bar');
  expect(restored.entries['BAZ']).toBe('qux');
  expect(restored.entries['NEW_KEY']).toBeUndefined();
});

test('rollbackToCheckpoint throws if checkpoint does not exist', async () => {
  await expect(
    rollbackToCheckpoint(vaultPath, password, '/nonexistent/file.checkpoint')
  ).rejects.toThrow('Checkpoint not found');
});

test('formatRollbackResult formats output correctly', () => {
  const result = { rolledBackTo: '2024-01-01.checkpoint', keysRestored: 5 };
  const output = formatRollbackResult(result);
  expect(output).toContain('2024-01-01.checkpoint');
  expect(output).toContain('5');
});
