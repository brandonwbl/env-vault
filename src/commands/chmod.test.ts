import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getChmodPath,
  loadChmod,
  saveChmod,
  setPermission,
  removePermission,
  canAccess,
  formatChmodList,
  ChmodStore,
} from './chmod';

const tmpChmodPath = path.join(os.tmpdir(), 'test-vault.chmod.json');

afterEach(() => {
  if (fs.existsSync(tmpChmodPath)) fs.unlinkSync(tmpChmodPath);
});

describe('getChmodPath', () => {
  it('returns .chmod.json path based on vault path', () => {
    const result = getChmodPath('/some/dir/my-vault.vault');
    expect(result).toBe('/some/dir/my-vault.chmod.json');
  });
});

describe('loadChmod', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadChmod('/nonexistent/path.chmod.json');
    expect(store.entries).toEqual([]);
  });

  it('loads existing chmod file', () => {
    const data: ChmodStore = { entries: [{ key: 'API_KEY', owner: 'alice', permissions: ['read'] }] };
    fs.writeFileSync(tmpChmodPath, JSON.stringify(data));
    const store = loadChmod(tmpChmodPath);
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].key).toBe('API_KEY');
  });
});

describe('saveChmod', () => {
  it('writes chmod store to disk', () => {
    const store: ChmodStore = { entries: [{ key: 'DB_PASS', owner: 'bob', permissions: ['read', 'write'] }] };
    saveChmod(tmpChmodPath, store);
    const loaded = loadChmod(tmpChmodPath);
    expect(loaded.entries[0].owner).toBe('bob');
  });
});

describe('setPermission', () => {
  it('adds a new permission entry', () => {
    const store: ChmodStore = { entries: [] };
    const updated = setPermission(store, 'SECRET', 'carol', ['read']);
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].permissions).toContain('read');
  });

  it('replaces existing entry for same key+owner', () => {
    const store: ChmodStore = { entries: [{ key: 'SECRET', owner: 'carol', permissions: ['read'] }] };
    const updated = setPermission(store, 'SECRET', 'carol', ['read', 'write']);
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].permissions).toContain('write');
  });
});

describe('removePermission', () => {
  it('removes an entry matching key and owner', () => {
    const store: ChmodStore = { entries: [{ key: 'TOKEN', owner: 'dave', permissions: ['read'] }] };
    const updated = removePermission(store, 'TOKEN', 'dave');
    expect(updated.entries).toHaveLength(0);
  });
});

describe('canAccess', () => {
  it('returns true when permission exists', () => {
    const store: ChmodStore = { entries: [{ key: 'KEY', owner: 'eve', permissions: ['read'] }] };
    expect(canAccess(store, 'KEY', 'eve', 'read')).toBe(true);
  });

  it('returns false when permission is missing', () => {
    const store: ChmodStore = { entries: [{ key: 'KEY', owner: 'eve', permissions: ['read'] }] };
    expect(canAccess(store, 'KEY', 'eve', 'write')).toBe(false);
  });

  it('returns false when no entry exists', () => {
    const store: ChmodStore = { entries: [] };
    expect(canAccess(store, 'KEY', 'frank', 'read')).toBe(false);
  });
});

describe('formatChmodList', () => {
  it('shows message when no entries', () => {
    expect(formatChmodList({ entries: [] })).toMatch(/No permission/);
  });

  it('formats entries as lines', () => {
    const store: ChmodStore = { entries: [{ key: 'API', owner: 'grace', permissions: ['read', 'write'] }] };
    const result = formatChmodList(store);
    expect(result).toContain('API');
    expect(result).toContain('grace');
    expect(result).toContain('read, write');
  });
});
