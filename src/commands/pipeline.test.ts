import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getPipelinePath,
  loadPipelineStore,
  savePipelineStore,
  addPipeline,
  removePipeline,
  findPipeline,
  executePipeline,
  formatPipelineList,
  PipelineStore,
} from './pipeline';

let tmpDir: string;
let storePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-test-'));
  storePath = path.join(tmpDir, '.pipeline-store.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getPipelinePath returns correct path', () => {
  const vaultPath = path.join(tmpDir, 'vault.enc');
  expect(getPipelinePath(vaultPath)).toBe(storePath);
});

test('loadPipelineStore returns empty store when file missing', () => {
  const store = loadPipelineStore(storePath);
  expect(store.pipelines).toEqual([]);
});

test('savePipelineStore and loadPipelineStore roundtrip', () => {
  const store: PipelineStore = { pipelines: [] };
  addPipeline(store, 'deploy', [{ command: 'export', args: { format: 'dotenv' } }]);
  savePipelineStore(storePath, store);
  const loaded = loadPipelineStore(storePath);
  expect(loaded.pipelines).toHaveLength(1);
  expect(loaded.pipelines[0].name).toBe('deploy');
});

test('addPipeline assigns id and timestamps', () => {
  const store: PipelineStore = { pipelines: [] };
  const p = addPipeline(store, 'ci', [{ command: 'lint', args: {} }]);
  expect(p.id).toMatch(/^pipeline_/);
  expect(p.createdAt).toBeTruthy();
  expect(store.pipelines).toHaveLength(1);
});

test('removePipeline removes existing pipeline', () => {
  const store: PipelineStore = { pipelines: [] };
  addPipeline(store, 'ci', []);
  expect(removePipeline(store, 'ci')).toBe(true);
  expect(store.pipelines).toHaveLength(0);
});

test('removePipeline returns false for missing pipeline', () => {
  const store: PipelineStore = { pipelines: [] };
  expect(removePipeline(store, 'nope')).toBe(false);
});

test('findPipeline returns correct pipeline', () => {
  const store: PipelineStore = { pipelines: [] };
  addPipeline(store, 'deploy', [{ command: 'export', args: {} }]);
  const found = findPipeline(store, 'deploy');
  expect(found?.name).toBe('deploy');
  expect(findPipeline(store, 'missing')).toBeUndefined();
});

test('executePipeline returns result for each step', () => {
  const store: PipelineStore = { pipelines: [] };
  const p = addPipeline(store, 'test', [
    { command: 'lint', args: {} },
    { command: 'export', args: { format: 'json' } },
  ]);
  const results = executePipeline(p, []);
  expect(results).toHaveLength(2);
  expect(results[0].step).toBe('lint');
  expect(results[0].success).toBe(true);
});

test('formatPipelineList shows message when empty', () => {
  const store: PipelineStore = { pipelines: [] };
  expect(formatPipelineList(store)).toBe('No pipelines defined.');
});

test('formatPipelineList lists pipelines', () => {
  const store: PipelineStore = { pipelines: [] };
  addPipeline(store, 'deploy', [{ command: 'export', args: {} }]);
  const output = formatPipelineList(store);
  expect(output).toContain('deploy');
  expect(output).toContain('1 steps');
});
