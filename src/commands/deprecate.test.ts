import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadDeprecationStore,
  saveDeprecationStore,
  markDeprecated,
  unmarkDeprecated,
  getDeprecation,
  formatDeprecationList,
  getDeprecatePath,
} from './deprecate';

const tmpVaultPath = path.join(os.tmpdir(), `deprecate-test-${Date.now()}.vault`);

afterEach(() => {
  const p = getDeprecatePath(tmpVaultPath);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('loadDeprecationStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadDeprecationStore(tmpVaultPath);
    expect(store.entries).toEqual([]);
  });
});

describe('markDeprecated', () => {
  it('adds a new deprecation entry', () => {
    const store = { entries: [] };
    const updated = markDeprecated(store, 'OLD_KEY', 'No longer used');
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].key).toBe('OLD_KEY');
    expect(updated.entries[0].reason).toBe('No longer used');
    expect(updated.entries[0].replacedBy).toBeUndefined();
  });

  it('stores replacedBy when provided', () => {
    const store = { entries: [] };
    const updated = markDeprecated(store, 'OLD_KEY', 'Renamed', 'NEW_KEY');
    expect(updated.entries[0].replacedBy).toBe('NEW_KEY');
  });

  it('updates existing entry for same key', () => {
    let store = { entries: [] };
    store = markDeprecated(store, 'KEY', 'First reason');
    store = markDeprecated(store, 'KEY', 'Updated reason', 'OTHER_KEY');
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].reason).toBe('Updated reason');
  });
});

describe('unmarkDeprecated', () => {
  it('removes a deprecation entry', () => {
    let store = { entries: [] };
    store = markDeprecated(store, 'KEY', 'old');
    store = unmarkDeprecated(store, 'KEY');
    expect(store.entries).toHaveLength(0);
  });

  it('is a no-op for unknown key', () => {
    const store = { entries: [] };
    const updated = unmarkDeprecated(store, 'MISSING');
    expect(updated.entries).toHaveLength(0);
  });
});

describe('getDeprecation', () => {
  it('returns entry for known key', () => {
    let store = { entries: [] };
    store = markDeprecated(store, 'X', 'reason');
    expect(getDeprecation(store, 'X')).toBeDefined();
  });

  it('returns undefined for unknown key', () => {
    expect(getDeprecation({ entries: [] }, 'Z')).toBeUndefined();
  });
});

describe('formatDeprecationList', () => {
  it('shows message for empty store', () => {
    expect(formatDeprecationList({ entries: [] })).toBe('No deprecated keys.');
  });

  it('formats entries with replacement', () => {
    let store = { entries: [] };
    store = markDeprecated(store, 'OLD', 'Moved', 'NEW');
    const out = formatDeprecationList(store);
    expect(out).toContain('OLD');
    expect(out).toContain('Moved');
    expect(out).toContain('replaced by: NEW');
  });
});

describe('saveDeprecationStore / loadDeprecationStore', () => {
  it('round-trips correctly', () => {
    let store = { entries: [] };
    store = markDeprecated(store, 'PERSIST_KEY', 'test save', 'NEW_KEY');
    saveDeprecationStore(tmpVaultPath, store);
    const loaded = loadDeprecationStore(tmpVaultPath);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].key).toBe('PERSIST_KEY');
    expect(loaded.entries[0].replacedBy).toBe('NEW_KEY');
  });
});
