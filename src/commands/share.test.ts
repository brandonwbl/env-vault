import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createShareToken,
  redeemShareToken,
  listShareTokens,
  formatShareList,
  getShareDir,
} from './share';
import { writeVault, createVault } from '../crypto/vault';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'share-test-'));
const vaultPath = path.join(tmpDir, 'test.vault');
const targetVaultPath = path.join(tmpDir, 'target.vault');
const password = 'test-password';
const sharePassword = 'share-secret';

beforeAll(async () => {
  const vault = createVault();
  vault.entries = [
    { key: 'API_KEY', value: 'abc123', tags: [] },
    { key: 'DB_URL', value: 'postgres://localhost', tags: [] },
    { key: 'SECRET', value: 'topsecret', tags: [] },
  ];
  await writeVault(vaultPath, vault, password);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getShareDir', () => {
  it('returns a .shares directory next to the vault', () => {
    const dir = getShareDir(vaultPath);
    expect(dir).toBe(path.join(tmpDir, '.shares'));
  });
});

describe('createShareToken', () => {
  it('creates a token file for selected keys', async () => {
    const token = await createShareToken(vaultPath, password, sharePassword, ['API_KEY', 'DB_URL']);
    expect(token.keys).toEqual(expect.arrayContaining(['API_KEY', 'DB_URL']));
    expect(token.keys).not.toContain('SECRET');
    expect(token.id).toBeTruthy();
    const tokenPath = path.join(getShareDir(vaultPath), `${token.id}.json`);
    expect(fs.existsSync(tokenPath)).toBe(true);
  });

  it('includes all keys when none specified', async () => {
    const token = await createShareToken(vaultPath, password, sharePassword, []);
    expect(token.keys).toHaveLength(3);
  });

  it('sets expiresAt when ttl is provided', async () => {
    const token = await createShareToken(vaultPath, password, sharePassword, [], 3600);
    expect(token.expiresAt).not.toBeNull();
    expect(new Date(token.expiresAt!).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('redeemShareToken', () => {
  it('imports entries into target vault', async () => {
    const token = await createShareToken(vaultPath, password, sharePassword, ['API_KEY']);
    const tokenPath = path.join(getShareDir(vaultPath), `${token.id}.json`);
    const imported = await redeemShareToken(tokenPath, sharePassword, targetVaultPath, 'new-pass');
    expect(imported).toContain('API_KEY');
  });

  it('throws on expired token', async () => {
    const token = await createShareToken(vaultPath, password, sharePassword, [], -1);
    const tokenPath = path.join(getShareDir(vaultPath), `${token.id}.json`);
    await expect(redeemShareToken(tokenPath, sharePassword, targetVaultPath, 'p')).rejects.toThrow('expired');
  });
});

describe('listShareTokens', () => {
  it('returns all tokens for the vault', async () => {
    const tokens = listShareTokens(vaultPath);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('returns empty array when no share dir exists', () => {
    const tokens = listShareTokens('/nonexistent/path/vault.vault');
    expect(tokens).toEqual([]);
  });
});

describe('formatShareList', () => {
  it('shows message when no tokens', () => {
    expect(formatShareList([])).toBe('No active share tokens.');
  });

  it('formats token list with id and keys', async () => {
    const tokens = listShareTokens(vaultPath);
    const output = formatShareList(tokens);
    expect(output).toContain(tokens[0].id);
  });
});
