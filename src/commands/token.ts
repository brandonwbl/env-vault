import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface TokenEntry {
  id: string;
  label: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
}

export interface TokenStore {
  tokens: TokenEntry[];
}

export function getTokenPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.vault-tokens.json');
}

export function loadTokenStore(tokenPath: string): TokenStore {
  if (!fs.existsSync(tokenPath)) return { tokens: [] };
  return JSON.parse(fs.readFileSync(tokenPath, 'utf-8')) as TokenStore;
}

export function saveTokenStore(tokenPath: string, store: TokenStore): void {
  fs.writeFileSync(tokenPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createToken(
  store: TokenStore,
  label: string,
  scopes: string[],
  expiresAt?: string
): { store: TokenStore; token: string; entry: TokenEntry } {
  const token = generateToken();
  const entry: TokenEntry = {
    id: token,
    label,
    scopes,
    createdAt: new Date().toISOString(),
    ...(expiresAt ? { expiresAt } : {}),
  };
  return { store: { tokens: [...store.tokens, entry] }, token, entry };
}

export function revokeToken(store: TokenStore, id: string): TokenStore {
  return { tokens: store.tokens.filter((t) => t.id !== id) };
}

export function isTokenExpired(entry: TokenEntry): boolean {
  if (!entry.expiresAt) return false;
  return new Date(entry.expiresAt) < new Date();
}

export function formatTokenList(store: TokenStore): string {
  if (store.tokens.length === 0) return 'No tokens found.';
  return store.tokens
    .map((t) => {
      const expired = isTokenExpired(t) ? ' [EXPIRED]' : '';
      const expiry = t.expiresAt ? ` expires=${t.expiresAt}` : '';
      return `${t.label} (${t.id.slice(0, 8)}...) scopes=[${t.scopes.join(',')}]${expiry}${expired}`;
    })
    .join('\n');
}
