import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getFreezePath,
  loadFreezeStore,
  saveFreezeStore,
  freezeKey,
  unfreezeKey,
  isFrozen,
  formatFreezeList,
  FreezeStore,
} from './freeze';

const tmpVaultPath = path.join(os.tmpdir(), 'test-vault.vault');

function emptyStore(): FreezeStore {
  return { frozenKeys: [], frozenAt: {} };
}

describe('getFreezePath', () => {
  it('derives freeze path from vault path', () => {
    const p = getFreezePath('/some/dir/my.vault');
    expect(p).toBe('/some/dir/my.freeze.json');
  });
});

describe('loadFreezeStore / saveFreezeStore', () => {
  const freezePath = getFreezePath(tmpVaultPath);

  afterEach(() => {
    if (fs.existsSync(freezePath)) fs.unlinkSync(freezePath);
  });

  it('returns empty store when file does not exist', () => {
    const store = loadFreezeStore(freezePath);
    expect(store.frozenKeys).toEqual([]);
    expect(store.frozenAt).toEqual({});
  });

  it('persists and reloads store', () => {
    let store = emptyStore();
    store = freezeKey(store, 'API_KEY');
    saveFreezeStore(freezePath, store);
    const loaded = loadFreezeStore(freezePath);
    expect(loaded.frozenKeys).toContain('API_KEY');
  });
});

describe('freezeKey', () => {
  it('adds a key to frozenKeys', () => {
    const store = freezeKey(emptyStore(), 'DB_URL');
    expect(store.frozenKeys).toContain('DB_URL');
    expect(store.frozenAt['DB_URL']).toBeDefined();
  });

  it('does not duplicate an already frozen key', () => {
    let store = freezeKey(emptyStore(), 'DB_URL');
    store = freezeKey(store, 'DB_URL');
    expect(store.frozenKeys.filter((k) => k === 'DB_URL').length).toBe(1);
  });
});

describe('unfreezeKey', () => {
  it('removes a key from frozenKeys', () => {
    let store = freezeKey(emptyStore(), 'SECRET');
    store = unfreezeKey(store, 'SECRET');
    expect(store.frozenKeys).not.toContain('SECRET');
    expect(store.frozenAt['SECRET']).toBeUndefined();
  });
});

describe('isFrozen', () => {
  it('returns true for frozen key', () => {
    const store = freezeKey(emptyStore(), 'TOKEN');
    expect(isFrozen(store, 'TOKEN')).toBe(true);
  });

  it('returns false for non-frozen key', () => {
    expect(isFrozen(emptyStore(), 'TOKEN')).toBe(false);
  });
});

describe('formatFreezeList', () => {
  it('shows message when no keys are frozen', () => {
    expect(formatFreezeList(emptyStore())).toBe('No frozen keys.');
  });

  it('lists frozen keys with timestamps', () => {
    const store = freezeKey(emptyStore(), 'API_KEY');
    const output = formatFreezeList(store);
    expect(output).toContain('API_KEY');
    expect(output).toContain('frozen at');
  });
});
