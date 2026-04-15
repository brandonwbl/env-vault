import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { formatEntries, runFormat, FormatStyle } from './format';
import { createVault, serializeVault, writeVault } from '../crypto';

const sampleEntries = [
  { key: 'DB_HOST', value: 'localhost' },
  { key: 'DB_PASS', value: 'secret"value' },
  { key: 'MULTI', value: 'line1\nline2' },
];

describe('formatEntries', () => {
  it('formats dotenv style', () => {
    const result = formatEntries(sampleEntries, 'dotenv');
    expect(result).toContain('DB_HOST=localhost');
    expect(result).toContain('DB_PASS="secret\\"value"');
  });

  it('formats json style', () => {
    const result = formatEntries(sampleEntries, 'json');
    const parsed = JSON.parse(result);
    expect(parsed.DB_HOST).toBe('localhost');
    expect(parsed.DB_PASS).toBe('secret"value');
    expect(parsed.MULTI).toBe('line1\nline2');
  });

  it('formats yaml style', () => {
    const result = formatEntries([{ key: 'SIMPLE', value: 'val' }], 'yaml');
    expect(result).toBe('SIMPLE: val');
  });

  it('formats yaml with special chars quoted', () => {
    const result = formatEntries([{ key: 'K', value: 'a: b' }], 'yaml');
    expect(result).toContain('"a: b"');
  });

  it('formats export style', () => {
    const result = formatEntries(sampleEntries, 'export');
    expect(result).toContain('export DB_HOST="localhost"');
    expect(result).toContain('export DB_PASS="secret\\"value"');
  });

  it('throws on unknown style', () => {
    expect(() => formatEntries(sampleEntries, 'xml' as FormatStyle)).toThrow();
  });
});

describe('runFormat', () => {
  let tmpDir: string;
  let vaultPath: string;
  const password = 'test-pass-123';

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-vault-fmt-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    const vault = await createVault(password);
    vault.entries = [{ key: 'API_KEY', value: 'abc123' }];
    const serialized = await serializeVault(vault, password);
    await writeVault(vaultPath, serialized);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('runs format and returns dotenv output', async () => {
    const result = await runFormat(vaultPath, password, 'dotenv');
    expect(result).toBe('API_KEY=abc123');
  });

  it('runs format and returns json output', async () => {
    const result = await runFormat(vaultPath, password, 'json');
    const parsed = JSON.parse(result);
    expect(parsed.API_KEY).toBe('abc123');
  });
});
