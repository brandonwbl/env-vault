import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getScopePath,
  loadScopes,
  saveScopes,
  addScope,
  removeScope,
  setActiveScope,
  clearActiveScope,
  getActiveScope,
  formatScopeList,
  ScopeStore,
} from './scope';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-test-'));
const tmpVaultPath = path.join(tmpDir, 'test.vault');
const scopePath = getScopePath(tmpVaultPath);

afterEach(() => {
  if (fs.existsSync(scopePath)) fs.unlinkSync(scopePath);
});

describe('getScopePath', () => {
  it('returns path in same directory as vault', () => {
    expect(scopePath).toContain('.vault-scopes.json');
  });
});

describe('loadScopes / saveScopes', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadScopes(scopePath);
    expect(store.scopes).toEqual({});
  });

  it('persists and reloads store', () => {
    const store: ScopeStore = { scopes: {}, active: undefined };
    saveScopes(scopePath, store);
    const loaded = loadScopes(scopePath);
    expect(loaded.scopes).toEqual({});
  });
});

describe('addScope', () => {
  it('adds a scope with keys', () => {
    const store = loadScopes(scopePath);
    const updated = addScope(store, 'production', ['DB_URL', 'API_KEY']);
    expect(updated.scopes['production'].keys).toContain('DB_URL');
  });

  it('duplicates keys', () => {
    const store = loadScopes(scopePath);
    const updated = addScope(store, 'dev', ['KEY', 'KEY', 'OTHER']);
    expect(updated.scopes['dev'].keys).toHaveLength(2);
  });

  it('throws if scope already exists', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'staging', ['X']);
    expect(() => addScope(store, 'staging', ['Y'])).toThrow('already exists');
  });
});

describe('removeScope', () => {
  it('removes an existing scope', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'temp', ['FOO']);
    store = removeScope(store, 'temp');
    expect(store.scopes['temp']).toBeUndefined();
  });

  it('clears active if removed scope was active', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'active-scope', ['BAR']);
    store = setActiveScope(store, 'active-scope');
    store = removeScope(store, 'active-scope');
    expect(store.active).toBeUndefined();
  });

  it('throws if scope not found', () => {
    const store = loadScopes(scopePath);
    expect(() => removeScope(store, 'ghost')).toThrow('not found');
  });
});

describe('setActiveScope / clearActiveScope / getActiveScope', () => {
  it('sets and retrieves active scope', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'qa', ['QA_KEY']);
    store = setActiveScope(store, 'qa');
    const active = getActiveScope(store);
    expect(active?.name).toBe('qa');
  });

  it('clears active scope', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'qa', ['QA_KEY']);
    store = setActiveScope(store, 'qa');
    store = clearActiveScope(store);
    expect(getActiveScope(store)).toBeUndefined();
  });
});

describe('formatScopeList', () => {
  it('returns message when no scopes', () => {
    const store = loadScopes(scopePath);
    expect(formatScopeList(store)).toBe('No scopes defined.');
  });

  it('includes scope name and keys in output', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'prod', ['DB', 'SECRET'], 'Production vars');
    const output = formatScopeList(store);
    expect(output).toContain('prod');
    expect(output).toContain('DB');
    expect(output).toContain('Production vars');
  });

  it('marks active scope', () => {
    let store = loadScopes(scopePath);
    store = addScope(store, 'live', ['LIVE_KEY']);
    store = setActiveScope(store, 'live');
    expect(formatScopeList(store)).toContain('(active)');
  });
});
