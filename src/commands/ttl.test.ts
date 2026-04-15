import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getTtlPath,
  loadTtlStore,
  saveTtlStore,
  setTtl,
  removeTtl,
  getExpiredKeys,
  formatTtlList,
  TtlStore,
} from './ttl';

const tmpVaultPath = path.join(os.tmpdir(), 'test-ttl-vault.env.vault');

afterEach(() => {
  const ttlPath = getTtlPath(tmpVaultPath);
  if (fs.existsSync(ttlPath)) fs.unlinkSync(ttlPath);
});

describe('getTtlPath', () => {
  it('returns a sibling .ttl.json file', () => {
    const result = getTtlPath('/some/dir/my-vault.vault');
    expect(result).toBe('/some/dir/my-vault.ttl.json');
  });
});

describe('loadTtlStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadTtlStore(tmpVaultPath);
    expect(store.entries).toEqual([]);
  });
});

describe('setTtl', () => {
  it('adds a new TTL entry', () => {
    const before = Date.now();
    const entry = setTtl(tmpVaultPath, 'API_KEY', 60);
    expect(entry.key).toBe('API_KEY');
    expect(entry.expiresAt).toBeGreaterThanOrEqual(before + 60000);
    const store = loadTtlStore(tmpVaultPath);
    expect(store.entries).toHaveLength(1);
  });

  it('updates an existing TTL entry', () => {
    setTtl(tmpVaultPath, 'API_KEY', 60);
    const updated = setTtl(tmpVaultPath, 'API_KEY', 120);
    const store = loadTtlStore(tmpVaultPath);
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].expiresAt).toBe(updated.expiresAt);
  });
});

describe('removeTtl', () => {
  it('removes an existing entry and returns true', () => {
    setTtl(tmpVaultPath, 'SECRET', 30);
    const result = removeTtl(tmpVaultPath, 'SECRET');
    expect(result).toBe(true);
    expect(loadTtlStore(tmpVaultPath).entries).toHaveLength(0);
  });

  it('returns false when key does not exist', () => {
    const result = removeTtl(tmpVaultPath, 'NONEXISTENT');
    expect(result).toBe(false);
  });
});

describe('getExpiredKeys', () => {
  it('returns keys whose TTL has passed', () => {
    const store: TtlStore = {
      entries: [
        { key: 'OLD_KEY', expiresAt: Date.now() - 1000 },
        { key: 'FRESH_KEY', expiresAt: Date.now() + 60000 },
      ],
    };
    saveTtlStore(tmpVaultPath, store);
    const expired = getExpiredKeys(tmpVaultPath);
    expect(expired).toEqual(['OLD_KEY']);
  });
});

describe('formatTtlList', () => {
  it('shows message when no entries', () => {
    expect(formatTtlList({ entries: [] })).toBe('No TTL entries set.');
  });

  it('shows EXPIRED for past entries', () => {
    const store: TtlStore = {
      entries: [{ key: 'OLD', expiresAt: Date.now() - 5000 }],
    };
    const output = formatTtlList(store);
    expect(output).toContain('OLD');
    expect(output).toContain('EXPIRED');
  });

  it('shows remaining seconds for future entries', () => {
    const store: TtlStore = {
      entries: [{ key: 'FRESH', expiresAt: Date.now() + 30000 }],
    };
    const output = formatTtlList(store);
    expect(output).toContain('FRESH');
    expect(output).toContain('expires in');
  });
});
