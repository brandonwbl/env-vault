import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerNamespaceCommands } from './namespace-cmd';
import { getNamespacePath, saveNamespaces } from './namespace';

let tmpDir: string;
let vaultPath: string;
let nsPath: string;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerNamespaceCommands(program, vaultPath);
  return program;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-nscmd-'));
  vaultPath = path.join(tmpDir, 'vault.ev');
  nsPath = getNamespacePath(vaultPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

test('namespace list prints default namespace', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['namespace', 'list'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('default'));
  spy.mockRestore();
});

test('namespace add creates a new namespace', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['namespace', 'add', 'staging'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('staging'));
  const store = JSON.parse(fs.readFileSync(nsPath, 'utf-8'));
  expect(store.namespaces).toContain('staging');
  spy.mockRestore();
});

test('namespace remove deletes a namespace', () => {
  saveNamespaces(nsPath, { namespaces: ['default', 'staging'], active: 'default' });
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['namespace', 'remove', 'staging'], { from: 'user' });
  const store = JSON.parse(fs.readFileSync(nsPath, 'utf-8'));
  expect(store.namespaces).not.toContain('staging');
  spy.mockRestore();
});

test('namespace switch changes active namespace', () => {
  saveNamespaces(nsPath, { namespaces: ['default', 'prod'], active: 'default' });
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['namespace', 'switch', 'prod'], { from: 'user' });
  const store = JSON.parse(fs.readFileSync(nsPath, 'utf-8'));
  expect(store.active).toBe('prod');
  spy.mockRestore();
});

test('namespace current prints active namespace', () => {
  saveNamespaces(nsPath, { namespaces: ['default', 'prod'], active: 'prod' });
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['namespace', 'current'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('prod');
  spy.mockRestore();
});
