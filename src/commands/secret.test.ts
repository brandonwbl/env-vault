import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getSecretPath,
  loadSecretStore,
  maskKey,
  unmaskKey,
  isMasked,
  applyMask,
  formatSecretList,
} from './secret';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-secret-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getSecretPath returns sibling file', () => {
  expect(getSecretPath(vaultPath)).toBe(path.join(tmpDir, '.secret-masks.json'));
});

test('loadSecretStore returns empty store when file absent', () => {
  const store = loadSecretStore(vaultPath);
  expect(store).toEqual({ masks: {} });
});

test('maskKey adds entry and persists', () => {
  maskKey(vaultPath, 'DB_PASS');
  const store = loadSecretStore(vaultPath);
  expect(store.masks['DB_PASS']).toEqual({ key: 'DB_PASS', masked: true, preview: false });
});

test('maskKey with preview flag', () => {
  maskKey(vaultPath, 'API_KEY', true);
  const store = loadSecretStore(vaultPath);
  expect(store.masks['API_KEY'].preview).toBe(true);
});

test('unmaskKey removes entry', () => {
  maskKey(vaultPath, 'SECRET');
  unmaskKey(vaultPath, 'SECRET');
  const store = loadSecretStore(vaultPath);
  expect(store.masks['SECRET']).toBeUndefined();
});

test('isMasked returns true for masked key', () => {
  const store = maskKey(vaultPath, 'TOKEN');
  expect(isMasked(store, 'TOKEN')).toBe(true);
});

test('isMasked returns false for unknown key', () => {
  const store = loadSecretStore(vaultPath);
  expect(isMasked(store, 'UNKNOWN')).toBe(false);
});

test('applyMask returns full mask by default', () => {
  expect(applyMask('supersecret', false)).toBe('********');
});

test('applyMask returns preview with partial value', () => {
  expect(applyMask('supersecret', true)).toBe('su****et');
});

test('applyMask handles short values in preview mode', () => {
  expect(applyMask('ab', true)).toBe('****');
});

test('formatSecretList shows no masked keys message', () => {
  const store = loadSecretStore(vaultPath);
  expect(formatSecretList(store)).toBe('No masked keys.');
});

test('formatSecretList lists masked keys', () => {
  maskKey(vaultPath, 'DB_PASS');
  maskKey(vaultPath, 'API_KEY', true);
  const store = loadSecretStore(vaultPath);
  const result = formatSecretList(store);
  expect(result).toContain('DB_PASS');
  expect(result).toContain('full mask');
  expect(result).toContain('API_KEY');
  expect(result).toContain('preview');
});
