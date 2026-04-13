import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerSnapshotCommands } from './snapshot-cmd';
import { createVault, writeVault, readVault } from '../crypto/vault';

const password = 'cmd-test-pass';
let tmpDir: string;
let vaultPath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-cmd-test-'));
  vaultPath = path.join(tmpDir, 'vault.enc');
  const vault = createVault();
  vault.entries.push({ key: 'API_KEY', value: 'secret123', tags: [] });
  await writeVault(vaultPath, password, vault);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommands(program);
  return program;
}

test('snapshot create command creates a snapshot', async () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await program.parseAsync(['snapshot', 'create', 'v1', '-v', vaultPath, '-p', password], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Snapshot created'));
  spy.mockRestore();
});

test('snapshot list command lists snapshots', async () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await program.parseAsync(['snapshot', 'create', 'v1', '-v', vaultPath, '-p', password], { from: 'user' });
  await program.parseAsync(['snapshot', 'list', '-v', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('v1'));
  spy.mockRestore();
});

test('snapshot restore command restores entries', async () => {
  const program = buildProgram();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await program.parseAsync(['snapshot', 'create', 'before', '-v', vaultPath, '-p', password], { from: 'user' });

  const vault = await readVault(vaultPath, password);
  vault.entries = [];
  await writeVault(vaultPath, password, vault);

  const { listSnapshots } = await import('./snapshot');
  const snaps = listSnapshots(vaultPath);
  expect(snaps).toHaveLength(1);

  await program.parseAsync(['snapshot', 'restore', snaps[0].id, '-v', vaultPath, '-p', password], { from: 'user' });
  const restored = await readVault(vaultPath, password);
  expect(restored.entries).toHaveLength(1);
  logSpy.mockRestore();
});

test('snapshot delete command removes snapshot', async () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await program.parseAsync(['snapshot', 'create', 'to-remove', '-v', vaultPath, '-p', password], { from: 'user' });

  const { listSnapshots } = await import('./snapshot');
  const snaps = listSnapshots(vaultPath);
  await program.parseAsync(['snapshot', 'delete', snaps[0].id, '-v', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('deleted'));
  expect(listSnapshots(vaultPath)).toHaveLength(0);
  spy.mockRestore();
});
