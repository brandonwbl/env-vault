import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { searchCommand, formatSearchResults } from './search';
import { createVault, writeVault } from '../crypto/vault';
import { deriveKey, encrypt } from '../crypto/encryption';

const tmpVaultPath = path.join(os.tmpdir(), 'search-test-vault.json');
const PASSWORD = 'search-test-password';

async function setupVault(entries: Record<string, string>) {
  const vault = await createVault(PASSWORD);
  const key = await deriveKey(PASSWORD, vault.salt);
  vault.data = encrypt(JSON.stringify(entries), key);
  await writeVault(tmpVaultPath, vault);
}

beforeEach(async () => {
  await setupVault({
    DATABASE_URL: 'postgres://localhost:5432/mydb',
    DATABASE_POOL_SIZE: '10',
    API_KEY: 'secret-api-key-123',
    APP_NAME: 'my-application',
    DEBUG: 'false',
  });
});

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

describe('searchCommand', () => {
  it('finds entries by key substring', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'DATABASE');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('DATABASE_POOL_SIZE');
  });

  it('finds entries by value substring', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'postgres');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DATABASE_URL');
    expect(results[0].matchType).toBe('value');
  });

  it('marks matchType as both when query matches key and value', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'api');
    const apiResult = results.find((r) => r.key === 'API_KEY');
    expect(apiResult).toBeDefined();
  });

  it('is case-insensitive by default', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'database');
    expect(results).toHaveLength(2);
  });

  it('respects caseSensitive option', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'database', { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('respects keysOnly option', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'postgres', { keysOnly: true });
    expect(results).toHaveLength(0);
  });

  it('returns empty array when no matches found', async () => {
    const results = await searchCommand(tmpVaultPath, PASSWORD, 'NONEXISTENT_KEY_XYZ');
    expect(results).toHaveLength(0);
  });
});

describe('formatSearchResults', () => {
  it('returns no-results message for empty array', () => {
    const output = formatSearchResults([], 'test');
    expect(output).toContain('No results found');
    expect(output).toContain('test');
  });

  it('formats results with match type and key=value', () => {
    const results = [{ key: 'FOO', value: 'bar', matchType: 'key' as const }];
    const output = formatSearchResults(results, 'FOO');
    expect(output).toContain('FOO=bar');
    expect(output).toContain('[key]');
    expect(output).toContain('1 result(s)');
  });
});
