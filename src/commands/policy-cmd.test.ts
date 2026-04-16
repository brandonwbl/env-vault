import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerPolicyCommands } from './policy-cmd';
import { loadPolicy } from './policy';

let tmpDir: string;
let vaultPath: string;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPolicyCommands(program);
  return program;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-cmd-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('policy add creates rule', () => {
  const program = buildProgram();
  program.parse(['policy', 'add', '^DB_', '--vault', vaultPath, '--required'], { from: 'user' });
  const p = loadPolicy(vaultPath);
  expect(p.rules).toHaveLength(1);
  expect(p.rules[0].required).toBe(true);
});

test('policy add with min/max length', () => {
  const program = buildProgram();
  program.parse(['policy', 'add', '^SECRET', '--vault', vaultPath, '--min-length', '10', '--max-length', '100'], { from: 'user' });
  const p = loadPolicy(vaultPath);
  expect(p.rules[0].minLength).toBe(10);
  expect(p.rules[0].maxLength).toBe(100);
});

test('policy remove deletes rule', () => {
  const program = buildProgram();
  program.parse(['policy', 'add', '^DB_', '--vault', vaultPath], { from: 'user' });
  program.parse(['policy', 'remove', '^DB_', '--vault', vaultPath], { from: 'user' });
  const p = loadPolicy(vaultPath);
  expect(p.rules).toHaveLength(0);
});

test('policy list prints rules', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = buildProgram();
  program.parse(['policy', 'add', '^API_', '--vault', vaultPath, '--required'], { from: 'user' });
  program.parse(['policy', 'list', '--vault', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('^API_'));
  spy.mockRestore();
});

test('policy list prints empty message', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = buildProgram();
  program.parse(['policy', 'list', '--vault', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('No policy rules defined.');
  spy.mockRestore();
});
