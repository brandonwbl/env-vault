import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerQuotaCommands } from './quota-cmd';
import { setQuota, loadQuota } from './quota';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerQuotaCommands(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quota-cmd-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('quota show', () => {
  it('prints default quota config', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['quota', 'show', vaultPath], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Max Keys'));
    spy.mockRestore();
  });
});

describe('quota set', () => {
  it('updates max-keys via CLI', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(
      ['quota', 'set', vaultPath, '--max-keys', '25'],
      { from: 'user' }
    );
    const store = loadQuota(vaultPath);
    expect(store.config.maxKeys).toBe(25);
    spy.mockRestore();
  });

  it('updates multiple fields at once', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(
      ['quota', 'set', vaultPath, '--max-keys', '10', '--max-value-length', '512'],
      { from: 'user' }
    );
    const store = loadQuota(vaultPath);
    expect(store.config.maxKeys).toBe(10);
    expect(store.config.maxValueLength).toBe(512);
    spy.mockRestore();
  });
});
