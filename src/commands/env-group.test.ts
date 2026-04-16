import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getEnvGroupPath,
  loadEnvGroups,
  saveEnvGroups,
  addGroup,
  removeGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  formatGroupList,
  EnvGroupStore,
} from './env-group';

let tmpDir: string;
let vaultPath: string;
let groupPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-group-test-'));
  vaultPath = path.join(tmpDir, 'vault.enc');
  groupPath = getEnvGroupPath(vaultPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getEnvGroupPath returns sibling .groups.json file', () => {
  expect(groupPath).toBe(path.join(tmpDir, 'vault.groups.json'));
});

test('loadEnvGroups returns empty store when file missing', () => {
  const store = loadEnvGroups(groupPath);
  expect(store).toEqual({ groups: {} });
});

test('saveEnvGroups and loadEnvGroups round-trip', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'db', ['DB_HOST', 'DB_PORT'], 'Database vars');
  saveEnvGroups(groupPath, store);
  const loaded = loadEnvGroups(groupPath);
  expect(loaded.groups['db'].keys).toEqual(['DB_HOST', 'DB_PORT']);
  expect(loaded.groups['db'].description).toBe('Database vars');
});

test('addGroup deduplicates keys', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'app', ['KEY_A', 'KEY_A', 'KEY_B']);
  expect(store.groups['app'].keys).toEqual(['KEY_A', 'KEY_B']);
});

test('addGroup updates existing group and preserves createdAt', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'app', ['KEY_A']);
  const created = store.groups['app'].createdAt;
  addGroup(store, 'app', ['KEY_A', 'KEY_B']);
  expect(store.groups['app'].createdAt).toBe(created);
  expect(store.groups['app'].keys).toContain('KEY_B');
});

test('removeGroup deletes the group', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'tmp', ['X']);
  removeGroup(store, 'tmp');
  expect(store.groups['tmp']).toBeUndefined();
});

test('addKeyToGroup appends key without duplicates', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'app', ['KEY_A']);
  addKeyToGroup(store, 'app', 'KEY_B');
  addKeyToGroup(store, 'app', 'KEY_B');
  expect(store.groups['app'].keys).toEqual(['KEY_A', 'KEY_B']);
});

test('addKeyToGroup throws for unknown group', () => {
  const store: EnvGroupStore = { groups: {} };
  expect(() => addKeyToGroup(store, 'missing', 'K')).toThrow("Group 'missing' not found");
});

test('removeKeyFromGroup removes key', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'app', ['KEY_A', 'KEY_B']);
  removeKeyFromGroup(store, 'app', 'KEY_A');
  expect(store.groups['app'].keys).toEqual(['KEY_B']);
});

test('formatGroupList returns placeholder when empty', () => {
  const store: EnvGroupStore = { groups: {} };
  expect(formatGroupList(store)).toBe('No groups defined.');
});

test('formatGroupList renders group names and keys', () => {
  const store: EnvGroupStore = { groups: {} };
  addGroup(store, 'db', ['DB_HOST', 'DB_PORT'], 'Database');
  const output = formatGroupList(store);
  expect(output).toContain('[db]');
  expect(output).toContain('DB_HOST');
  expect(output).toContain('Database');
});
