import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { auditEntries, formatAuditResult, runAudit, AuditIssue } from './audit';
import { writeVault, readVault } from '../crypto/vault';
import { createVault } from '../crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const tmpVaultPath = path.join(os.tmpdir(), `audit-test-${Date.now()}.vault`);
const password = 'audit-test-pass';

beforeEach(async () => {
  const vault = createVault();
  vault.entries['DB_HOST'] = { value: 'localhost', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  vault.entries['API_SECRET'] = { value: 'abc', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await writeVault(tmpVaultPath, vault, password);
});

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

describe('auditEntries', () => {
  it('returns no issues for clean entries', () => {
    const entries = {
      API_KEY: { value: 'super-secret-key-1234', createdAt: '', updatedAt: '' },
    };
    expect(auditEntries(entries)).toHaveLength(0);
  });

  it('flags empty values as medium severity', () => {
    const entries = { EMPTY_KEY: { value: '', createdAt: '', updatedAt: '' } };
    const issues = auditEntries(entries);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('medium');
  });

  it('flags placeholder values as high severity', () => {
    const entries = { MY_TOKEN: { value: 'changeme', createdAt: '', updatedAt: '' } };
    const issues = auditEntries(entries);
    expect(issues.some(i => i.severity === 'high')).toBe(true);
  });

  it('flags short secret values as high severity', () => {
    const entries = { APP_PASSWORD: { value: '123', createdAt: '', updatedAt: '' } };
    const issues = auditEntries(entries);
    expect(issues.some(i => i.severity === 'high' && i.key === 'APP_PASSWORD')).toBe(true);
  });

  it('flags default insecure values as medium severity', () => {
    const entries = { DB_HOST: { value: 'localhost', createdAt: '', updatedAt: '' } };
    const issues = auditEntries(entries);
    expect(issues.some(i => i.severity === 'medium')).toBe(true);
  });
});

describe('formatAuditResult', () => {
  it('returns success message when no issues', () => {
    expect(formatAuditResult([])).toContain('No issues found');
  });

  it('includes issue count and severity icons', () => {
    const issues: AuditIssue[] = [
      { key: 'FOO', severity: 'high', message: 'test high' },
      { key: 'BAR', severity: 'low', message: 'test low' },
    ];
    const result = formatAuditResult(issues);
    expect(result).toContain('2 issue');
    expect(result).toContain('HIGH');
    expect(result).toContain('LOW');
  });
});

describe('runAudit', () => {
  it('runs without throwing on a valid vault', async () => {
    await expect(runAudit(tmpVaultPath, password)).resolves.not.toThrow();
  });
});
