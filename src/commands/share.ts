import * as fs from 'fs';
import * as path from 'path';
import { readVault, writeVault, createVault } from '../crypto/vault';
import { deriveKey, encrypt, decrypt } from '../crypto/encryption';

export interface ShareToken {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  keys: string[];
  encryptedPayload: string;
  iv: string;
  salt: string;
}

export function getShareDir(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.shares');
}

export async function createShareToken(
  vaultPath: string,
  password: string,
  sharePassword: string,
  keys: string[],
  ttlSeconds?: number
): Promise<ShareToken> {
  const vault = await readVault(vaultPath, password);
  const subset: Record<string, string> = {};

  for (const entry of vault.entries) {
    if (keys.length === 0 || keys.includes(entry.key)) {
      subset[entry.key] = entry.value;
    }
  }

  const payload = JSON.stringify(subset);
  const { key, salt } = await deriveKey(sharePassword);
  const { encrypted, iv } = await encrypt(payload, key);

  const token: ShareToken = {
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000).toISOString() : null,
    keys: Object.keys(subset),
    encryptedPayload: encrypted,
    iv,
    salt,
  };

  const shareDir = getShareDir(vaultPath);
  if (!fs.existsSync(shareDir)) fs.mkdirSync(shareDir, { recursive: true });
  fs.writeFileSync(path.join(shareDir, `${token.id}.json`), JSON.stringify(token, null, 2));

  return token;
}

export async function redeemShareToken(
  tokenPath: string,
  sharePassword: string,
  targetVaultPath: string,
  targetPassword: string
): Promise<string[]> {
  const raw = fs.readFileSync(tokenPath, 'utf-8');
  const token: ShareToken = JSON.parse(raw);

  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    throw new Error('Share token has expired');
  }

  const { key } = await deriveKey(sharePassword, token.salt);
  const decrypted = await decrypt(token.encryptedPayload, key, entries: Record<string, string> = JSON.parse(decrypted);

  const vault = fs.existsSync(targetVaultPath)
    ? await readVault(targetVaultPath, targetPassword)
    : createVault();

  const imported: string[] = [];
  for (const [k, v] of Object.entries(entries)) {
    const existing = vault.entries.findIndex((e) => e.key === k);
    if (existing >= 0) {
      vault.entries[existing].value = v;
    } else {
      vault.entries.push({ key: k, value: v, tags: [] });
    }
    imported.push(k);
  }

  await writeVault(targetVaultPath, vault, targetPassword);
  return imported;
}

export function listShareTokens(vaultPath: string): ShareToken[] {
  const shareDir = getShareDir(vaultPath);
  if (!fs.existsSync(shareDir)) return [];
  return fs.readdirSync(shareDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(shareDir, f), 'utf-8')));
}

export function formatShareList(tokens: ShareToken[]): string {
  if (tokens.length === 0) return 'No active share tokens.';
  return tokens
    .map((t) => {
      const exp = t.expiresAt ? `expires ${t.expiresAt}` : 'no expiry';
      const expired = t.expiresAt && new Date(t.expiresAt) < new Date() ? ' [EXPIRED]' : '';
      return `  ${t.id}  keys=[${t.keys.join(', ')}]  created=${t.createdAt}  ${exp}${expired}`;
    })
    .join('\n');
}
