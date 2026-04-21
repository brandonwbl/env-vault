import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getTokenPath,
  loadTokenStore,
  saveTokenStore,
  createToken,
  revokeToken,
  isTokenExpired,
  formatTokenList,
  TokenStore,
} from './token';

const tmpVaultPath = path.join(os.tmpdir(), 'test-vault-token.vault');
const tokenPath = getTokenPath(tmpVaultPath);

afterEach(() => {
  if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
});

describe('loadTokenStore', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadTokenStore(tokenPath);
    expect(store.tokens).toHaveLength(0);
  });
});

describe('saveTokenStore / loadTokenStore', () => {
  it('persists and reloads tokens', () => {
    const store: TokenStore = { tokens: [] };
    const { store: updated } = createToken(store, 'ci', ['read']);
    saveTokenStore(tokenPath, updated);
    const loaded = loadTokenStore(tokenPath);
    expect(loaded.tokens).toHaveLength(1);
    expect(loaded.tokens[0].label).toBe('ci');
  });
});

describe('createToken', () => {
  it('generates a unique token id', () => {
    const store: TokenStore = { tokens: [] };
    const { token, entry } = createToken(store, 'deploy', ['read', 'write']);
    expect(token).toHaveLength(64);
    expect(entry.id).toBe(token);
    expect(entry.scopes).toEqual(['read', 'write']);
  });

  it('sets expiresAt when provided', () => {
    const store: TokenStore = { tokens: [] };
    const expiry = '2099-01-01T00:00:00.000Z';
    const { entry } = createToken(store, 'tmp', ['read'], expiry);
    expect(entry.expiresAt).toBe(expiry);
  });
});

describe('revokeToken', () => {
  it('removes token by id', () => {
    let store: TokenStore = { tokens: [] };
    const { store: s1, token } = createToken(store, 'a', ['read']);
    const { store: s2 } = createToken(s1, 'b', ['write']);
    const revoked = revokeToken(s2, token);
    expect(revoked.tokens).toHaveLength(1);
    expect(revoked.tokens[0].label).toBe('b');
  });
});

describe('isTokenExpired', () => {
  it('returns false for tokens without expiry', () => {
    const { entry } = createToken({ tokens: [] }, 'x', []);
    expect(isTokenExpired(entry)).toBe(false);
  });

  it('returns true for past expiry', () => {
    const { entry } = createToken({ tokens: [] }, 'x', [], '2000-01-01T00:00:00.000Z');
    expect(isTokenExpired(entry)).toBe(true);
  });
});

describe('formatTokenList', () => {
  it('returns message when empty', () => {
    expect(formatTokenList({ tokens: [] })).toBe('No tokens found.');
  });

  it('formats tokens with scopes and expiry', () => {
    const { store } = createToken({ tokens: [] }, 'ci', ['read'], '2099-12-31T00:00:00.000Z');
    const output = formatTokenList(store);
    expect(output).toContain('ci');
    expect(output).toContain('read');
    expect(output).toContain('2099-12-31');
  });

  it('marks expired tokens', () => {
    const { store } = createToken({ tokens: [] }, 'old', ['read'], '2000-01-01T00:00:00.000Z');
    expect(formatTokenList(store)).toContain('[EXPIRED]');
  });
});
