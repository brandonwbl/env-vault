import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getNamespacePath,
  loadNamespaces,
  saveNamespaces,
  addNamespace,
  removeNamespace,
  switchNamespace,
  formatNamespaceList,
} from './namespace';

let tmpDir: string;
let nsPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-ns-'));
  nsPath = path.join(tmpDir, 'vault.namespaces.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

test('getNamespacePath derives correct path', () => {
  const vaultPath = '/some/dir/vault.ev';
  expect(getNamespacePath(vaultPath)).toBe('/some/dir/vault.namespaces.json');
});

test('loadNamespaces returns defaults when file absent', () => {
  const store = loadNamespaces(nsPath);
  expect(store.namespaces).toContain('default');
  expect(store.active).toBe('default');
});

test('saveNamespaces and loadNamespaces round-trip', () => {
  const store = { namespaces: ['default', 'staging'], active: 'staging' };
  saveNamespaces(nsPath, store);
  const loaded = loadNamespaces(nsPath);
  expect(loaded).toEqual(store);
});

test('addNamespace adds a new namespace', () => {
  const store = { namespaces: ['default'], active: 'default' };
  const updated = addNamespace(store, 'production');
  expect(updated.namespaces).toContain('production');
});

test('addNamespace throws on duplicate', () => {
  const store = { namespaces: ['default'], active: 'default' };
  expect(() => addNamespace(store, 'default')).toThrow('already exists');
});

test('removeNamespace removes existing namespace', () => {
  const store = { namespaces: ['default', 'staging'], active: 'default' };
  const updated = removeNamespace(store, 'staging');
  expect(updated.namespaces).not.toContain('staging');
});

test('removeNamespace throws when removing default', () => {
  const store = { namespaces: ['default'], active: 'default' };
  expect(() => removeNamespace(store, 'default')).toThrow('Cannot remove');
});

test('removeNamespace resets active when active is removed', () => {
  const store = { namespaces: ['default', 'staging'], active: 'staging' };
  const updated = removeNamespace(store, 'staging');
  expect(updated.active).toBe('default');
});

test('switchNamespace changes active', () => {
  const store = { namespaces: ['default', 'staging'], active: 'default' };
  const updated = switchNamespace(store, 'staging');
  expect(updated.active).toBe('staging');
});

test('switchNamespace throws for unknown namespace', () => {
  const store = { namespaces: ['default'], active: 'default' };
  expect(() => switchNamespace(store, 'unknown')).toThrow('not found');
});

test('formatNamespaceList marks active with asterisk', () => {
  const store = { namespaces: ['default', 'staging'], active: 'staging' };
  const output = formatNamespaceList(store);
  expect(output).toContain('* staging');
  expect(output).toContain('  default');
});
