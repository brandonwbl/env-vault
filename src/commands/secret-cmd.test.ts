import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerSecretCommands } from './secret-cmd';
import { loadSecretStore } from './secret';

let tmpDir: string;
let vaultPath: string;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSecretCommands(program, vaultPath);
  return program;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-secret-cmd-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('secret mask adds key to store', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'secret', 'mask', 'DB_PASS']);
  const store = loadSecretStore(vaultPath);
  expect(store.masks['DB_PASS']).toBeDefined();
  expect(store.masks['DB_PASS'].masked).toBe(true);
  expect(store.masks['DB_PASS'].preview).toBe(false);
});

test('secret mask --preview sets preview flag', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'secret', 'mask', 'API_KEY', '--preview']);
  const store = loadSecretStore(vaultPath);
  expect(store.masks['API_KEY'].preview).toBe(true);
});

test('secret unmask removes key from store', () => {
  const program = buildProgram();
  program.parse(['node', 'test', 'secret', 'mask', 'TOKEN']);
  program.parse(['node', 'test', 'secret', 'unmask', 'TOKEN']);
  const store = loadSecretStore(vaultPath);
  expect(store.masks['TOKEN']).toBeUndefined();
});

test('secret list prints no masked keys when empty', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = buildProgram();
  program.parse(['node', 'test', 'secret', 'list']);
  expect(spy).toHaveBeenCalledWith('No masked keys.');
  spy.mockRestore();
});

test('secret list prints masked keys', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = buildProgram();
  program.parse(['node', 'test', 'secret', 'mask', 'DB_PASS']);
  spy.mockClear();
  program.parse(['node', 'test', 'secret', 'list']);
  const output = spy.mock.calls[0][0] as string;
  expect(output).toContain('DB_PASS');
  spy.mockRestore();
});
