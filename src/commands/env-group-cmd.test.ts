import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerEnvGroupCommands } from './env-group-cmd';
import { getEnvGroupPath, loadEnvGroups } from './env-group';

let tmpDir: string;
let vaultPath: string;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerEnvGroupCommands(program);
  return program;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-group-cmd-test-'));
  vaultPath = path.join(tmpDir, 'vault.enc');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('group create persists group with keys', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'db', 'DB_HOST', 'DB_PORT', '--vault', vaultPath], { from: 'user' });
  const store = loadEnvGroups(getEnvGroupPath(vaultPath));
  expect(store.groups['db']).toBeDefined();
  expect(store.groups['db'].keys).toEqual(['DB_HOST', 'DB_PORT']);
});

test('group create with description stores it', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'app', '--description', 'App vars', '--vault', vaultPath], { from: 'user' });
  const store = loadEnvGroups(getEnvGroupPath(vaultPath));
  expect(store.groups['app'].description).toBe('App vars');
});

test('group delete removes group', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'tmp', 'X', '--vault', vaultPath], { from: 'user' });
  program.parse(['group', 'delete', 'tmp', '--vault', vaultPath], { from: 'user' });
  const store = loadEnvGroups(getEnvGroupPath(vaultPath));
  expect(store.groups['tmp']).toBeUndefined();
});

test('group add-key appends key to group', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'app', 'KEY_A', '--vault', vaultPath], { from: 'user' });
  program.parse(['group', 'add-key', 'app', 'KEY_B', '--vault', vaultPath], { from: 'user' });
  const store = loadEnvGroups(getEnvGroupPath(vaultPath));
  expect(store.groups['app'].keys).toContain('KEY_B');
});

test('group remove-key removes key from group', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'app', 'KEY_A', 'KEY_B', '--vault', vaultPath], { from: 'user' });
  program.parse(['group', 'remove-key', 'app', 'KEY_A', '--vault', vaultPath], { from: 'user' });
  const store = loadEnvGroups(getEnvGroupPath(vaultPath));
  expect(store.groups['app'].keys).not.toContain('KEY_A');
  expect(store.groups['app'].keys).toContain('KEY_B');
});

test('group list outputs group info', () => {
  const program = buildProgram();
  program.parse(['group', 'create', 'infra', 'AWS_KEY', '--description', 'Infra', '--vault', vaultPath], { from: 'user' });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['group', 'list', '--vault', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('[infra]'));
  spy.mockRestore();
});
