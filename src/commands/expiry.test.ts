import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getExpiryPath,
  loadExpiryStore,
  setExpiry,
  removeExpiry,
  getExpiredKeys,
  formatExpiryList,
} from './expiry';

let tmpVault: string;

beforeEach(() => {
  tmpVault = path.join(os.tmpdir(), `test-${Date.now()}.vault`);
});

afterEach(() => {
  const p = getExpiryPath(tmpVault);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('loadExpiryStore returns empty store when no file', () => {
  const store = loadExpiryStore(tmpVault);
  expect(store.entries).toEqual([]);
});

test('setExpiry adds an entry', () => {
  const d = new Date('2099-01-01');
  const store = setExpiry(tmpVault, 'API_KEY', d);
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0].key).toBe('API_KEY');
  expect(store.entries[0].expiresAt).toBe(d.toISOString());
});

test('setExpiry updates existing entry', () => {
  setExpiry(tmpVault, 'API_KEY', new Date('2099-01-01'));
  const d2 = new Date('2099-06-01');
  const store = setExpiry(tmpVault, 'API_KEY', d2);
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0].expiresAt).toBe(d2.toISOString());
});

test('removeExpiry deletes an entry', () => {
  setExpiry(tmpVault, 'API_KEY', new Date('2099-01-01'));
  const store = removeExpiry(tmpVault, 'API_KEY');
  expect(store.entries).toHaveLength(0);
});

test('getExpiredKeys returns keys past expiry', () => {
  setExpiry(tmpVault, 'OLD_KEY', new Date('2000-01-01'));
  setExpiry(tmpVault, 'FUTURE_KEY', new Date('2099-01-01'));
  const expired = getExpiredKeys(tmpVault);
  expect(expired).toContain('OLD_KEY');
  expect(expired).not.toContain('FUTURE_KEY');
});

test('formatExpiryList shows entries', () => {
  setExpiry(tmpVault, 'MY_KEY', new Date('2099-03-15'));
  const store = loadExpiryStore(tmpVault);
  const out = formatExpiryList(store);
  expect(out).toContain('MY_KEY');
});

test('formatExpiryList shows empty message', () => {
  const store = loadExpiryStore(tmpVault);
  expect(formatExpiryList(store)).toBe('No expiry entries set.');
});
