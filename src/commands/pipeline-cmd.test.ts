import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerPipelineCommands } from './pipeline-cmd';
import { getPipelinePath, loadPipelineStore } from './pipeline';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPipelineCommands(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-cmd-test-'));
  vaultPath = path.join(tmpDir, 'vault.enc');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('pipeline add creates a pipeline', () => {
  const program = buildProgram();
  program.parse(['pipeline', 'add', 'deploy', 'export:format=dotenv', '-v', vaultPath], { from: 'user' });
  const store = loadPipelineStore(getPipelinePath(vaultPath));
  expect(store.pipelines).toHaveLength(1);
  expect(store.pipelines[0].name).toBe('deploy');
});

test('pipeline list outputs pipelines', () => {
  const program = buildProgram();
  program.parse(['pipeline', 'add', 'ci', 'lint:strict=true', '-v', vaultPath], { from: 'user' });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  buildProgram().parse(['pipeline', 'list', '-v', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('ci'));
  spy.mockRestore();
});

test('pipeline remove deletes a pipeline', () => {
  const program = buildProgram();
  program.parse(['pipeline', 'add', 'ci', 'lint', '-v', vaultPath], { from: 'user' });
  buildProgram().parse(['pipeline', 'remove', 'ci', '-v', vaultPath], { from: 'user' });
  const store = loadPipelineStore(getPipelinePath(vaultPath));
  expect(store.pipelines).toHaveLength(0);
});

test('pipeline remove exits on missing pipeline', () => {
  const program = buildProgram();
  const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() =>
    program.parse(['pipeline', 'remove', 'nope', '-v', vaultPath], { from: 'user' })
  ).toThrow('exit');
  spy.mockRestore();
});

test('pipeline show prints pipeline details', () => {
  const program = buildProgram();
  program.parse(['pipeline', 'add', 'deploy', 'export:format=json', '-v', vaultPath], { from: 'user' });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  buildProgram().parse(['pipeline', 'show', 'deploy', '-v', vaultPath], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('deploy'));
  spy.mockRestore();
});
