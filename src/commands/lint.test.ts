import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { lintEntries, formatLintResult, lintCommand, LintResult } from './lint';
import { writeVault, createVault } from '../crypto';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const tmpVaultPath = () => join(mkdtempSync(join(tmpdir(), 'lint-test-')), 'vault.enc');

describe('lintEntries', () => {
  it('returns valid with no issues for clean entries', () => {
    const result = lintEntries({ DATABASE_URL: 'postgres://localhost/db', PORT: '3000' });
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('reports error for lowercase key', () => {
    const result = lintEntries({ database_url: 'value' });
    expect(result.valid).toBe(false);
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].key).toBe('database_url');
  });

  it('reports error for key with leading digit', () => {
    const result = lintEntries({ '1_KEY': 'value' });
    expect(result.valid).toBe(false);
    expect(result.issues[0].severity).toBe('error');
  });

  it('reports warning for empty value on non-optional key', () => {
    const result = lintEntries({ API_URL: '' });
    expect(result.valid).toBe(true);
    const warn = result.issues.find((i) => i.key === 'API_URL');
    expect(warn?.severity).toBe('warning');
  });

  it('does not warn on empty value for OPTIONAL_ prefixed key', () => {
    const result = lintEntries({ OPTIONAL_FEATURE: '' });
    expect(result.issues.filter((i) => i.key === 'OPTIONAL_FEATURE')).toHaveLength(0);
  });

  it('warns when sensitive key has short value', () => {
    const result = lintEntries({ SECRET_KEY: 'abc' });
    const warn = result.issues.find((i) => i.key === 'SECRET_KEY' && i.severity === 'warning');
    expect(warn).toBeDefined();
  });

  it('does not warn on sensitive key with adequate value length', () => {
    const result = lintEntries({ SECRET_KEY: 'supersecretvalue123' });
    expect(result.issues.filter((i) => i.key === 'SECRET_KEY')).toHaveLength(0);
  });
});

describe('formatLintResult', () => {
  it('returns success message when no issues', () => {
    expect(formatLintResult({ issues: [], valid: true })).toBe('✓ No issues found.');
  });

  it('formats issues with severity prefix', () => {
    const result: LintResult = {
      issues: [{ key: 'bad_key', severity: 'error', message: 'must be uppercase' }],
      valid: false,
    };
    expect(formatLintResult(result)).toContain('[ERROR]');
    expect(formatLintResult(result)).toContain('bad_key');
  });
});

describe('lintCommand', () => {
  let vaultPath: string;
  const password = 'test-password';

  beforeEach(async () => {
    vaultPath = tmpVaultPath();
    const vault = createVault({ VALID_KEY: 'value', bad_key: 'oops' });
    await writeVault(vaultPath, vault, password);
  });

  afterEach(() => {
    rmSync(vaultPath, { force: true });
  });

  it('reads vault and returns lint results', async () => {
    const result = await lintCommand(vaultPath, password);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.key === 'bad_key')).toBe(true);
  });
});
