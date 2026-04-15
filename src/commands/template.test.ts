import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createVault, writeVault, readVault } from '../crypto';
import {
  extractTemplate,
  formatTemplate,
  templateCommand,
  applyTemplate,
} from './template';

const password = 'test-password';
let tmpDir: string;
let vaultPath: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'env-vault-template-'));
  vaultPath = join(tmpDir, 'test.vault');
  const vault = createVault();
  vault.entries = { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret' };
  await writeVault(vaultPath, password, vault);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('extractTemplate', () => {
  it('extracts keys as template entries', () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    const result = extractTemplate(entries);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('FOO');
    expect(result[0].required).toBe(true);
    expect(result[0].example).toBe('bar');
  });
});

describe('formatTemplate', () => {
  it('renders keys with empty values', () => {
    const entries = [{ key: 'FOO', required: true, example: 'bar' }];
    const output = formatTemplate(entries);
    expect(output).toContain('FOO=');
    expect(output).toContain('# example: bar');
  });

  it('renders description when provided', () => {
    const entries = [{ key: 'API_KEY', required: true, description: 'Your API key' }];
    const output = formatTemplate(entries);
    expect(output).toContain('# Your API key');
  });
});

describe('templateCommand', () => {
  it('returns a template string from vault', async () => {
    const output = await templateCommand(vaultPath, password);
    expect(output).toContain('DB_HOST=');
    expect(output).toContain('API_KEY=');
  });

  it('writes template to file when outputPath given', async () => {
    const { readFile } = await import('fs/promises');
    const outPath = join(tmpDir, 'template.env');
    await templateCommand(vaultPath, password, outPath);
    const content = await readFile(outPath, 'utf-8');
    expect(content).toContain('DB_PORT=');
  });
});

describe('applyTemplate', () => {
  it('merges values into vault', async () => {
    await applyTemplate(vaultPath, password, { DB_HOST: 'prod-host', NEW_KEY: 'new-val' });
    const vault = await readVault(vaultPath, password);
    expect(vault.entries?.DB_HOST).toBe('prod-host');
    expect(vault.entries?.NEW_KEY).toBe('new-val');
  });

  it('throws in strict mode when required keys are missing', async () => {
    await expect(
      applyTemplate(vaultPath, password, {}, true)
    ).rejects.toThrow('Missing required keys');
  });
});
