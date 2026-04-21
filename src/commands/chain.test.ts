import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addChain,
  emptyChainStore,
  formatChainDetail,
  formatChainList,
  getChain,
  getChainPath,
  loadChainStore,
  removeChain,
  saveChainStore,
} from './chain';

const tmpChainPath = path.join(os.tmpdir(), `test-${Date.now()}.chains.json`);

afterEach(() => {
  if (fs.existsSync(tmpChainPath)) fs.unlinkSync(tmpChainPath);
});

describe('getChainPath', () => {
  it('replaces .vault extension', () => {
    expect(getChainPath('/tmp/my.vault')).toBe('/tmp/my.chains.json');
  });
});

describe('loadChainStore / saveChainStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadChainStore('/nonexistent/path.chains.json');
    expect(store.chains).toEqual({});
  });

  it('round-trips store to disk', () => {
    const store = addChain(emptyChainStore(), 'deploy', [
      { command: 'export', args: ['--env', 'prod'] },
    ]);
    saveChainStore(tmpChainPath, store);
    const loaded = loadChainStore(tmpChainPath);
    expect(loaded.chains['deploy']).toBeDefined();
    expect(loaded.chains['deploy'].steps).toHaveLength(1);
  });
});

describe('addChain', () => {
  it('adds a new chain', () => {
    const store = addChain(emptyChainStore(), 'ci', [
      { command: 'lint', args: [] },
      { command: 'validate', args: [] },
    ]);
    expect(store.chains['ci'].steps).toHaveLength(2);
    expect(store.chains['ci'].name).toBe('ci');
  });

  it('overwrites an existing chain', () => {
    let store = addChain(emptyChainStore(), 'ci', [{ command: 'lint', args: [] }]);
    store = addChain(store, 'ci', [{ command: 'validate', args: [] }, { command: 'audit', args: [] }]);
    expect(store.chains['ci'].steps).toHaveLength(2);
  });
});

describe('removeChain', () => {
  it('removes an existing chain', () => {
    let store = addChain(emptyChainStore(), 'deploy', [{ command: 'export', args: [] }]);
    store = removeChain(store, 'deploy');
    expect(store.chains['deploy']).toBeUndefined();
  });

  it('is a no-op for unknown chains', () => {
    const store = removeChain(emptyChainStore(), 'ghost');
    expect(Object.keys(store.chains)).toHaveLength(0);
  });
});

describe('getChain', () => {
  it('returns the chain if it exists', () => {
    const store = addChain(emptyChainStore(), 'setup', [{ command: 'import', args: ['.env'] }]);
    expect(getChain(store, 'setup')).toBeDefined();
  });

  it('returns undefined for missing chain', () => {
    expect(getChain(emptyChainStore(), 'missing')).toBeUndefined();
  });
});

describe('formatChainList', () => {
  it('shows message when no chains', () => {
    expect(formatChainList(emptyChainStore())).toBe('No chains defined.');
  });

  it('lists chains with step counts', () => {
    const store = addChain(emptyChainStore(), 'deploy', [
      { command: 'export', args: [] },
      { command: 'rotate', args: [] },
    ]);
    const output = formatChainList(store);
    expect(output).toContain('deploy');
    expect(output).toContain('2 steps');
  });
});

describe('formatChainDetail', () => {
  it('includes chain name and steps', () => {
    const store = addChain(emptyChainStore(), 'release', [
      { command: 'backup', args: ['--label', 'pre-release'] },
      { command: 'rotate', args: [] },
    ]);
    const chain = getChain(store, 'release')!;
    const output = formatChainDetail(chain);
    expect(output).toContain('Chain: release');
    expect(output).toContain('1. backup --label pre-release');
    expect(output).toContain('2. rotate');
  });
});
