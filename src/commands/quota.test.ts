import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getQuotaPath,
  loadQuota,
  saveQuota,
  setQuota,
  checkQuota,
  formatQuota,
  QuotaConfig,
} from './quota';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quota-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getQuotaPath', () => {
  it('returns .quota.json next to vault', () => {
    expect(getQuotaPath(vaultPath)).toBe(path.join(tmpDir, '.quota.json'));
  });
});

describe('loadQuota / saveQuota', () => {
  it('returns defaults when no file exists', () => {
    const store = loadQuota(vaultPath);
    expect(store.config.maxKeys).toBe(500);
    expect(store.config.maxValueLength).toBe(4096);
  });

  it('persists and reloads quota', () => {
    const store = loadQuota(vaultPath);
    store.config.maxKeys = 10;
    saveQuota(vaultPath, store);
    const reloaded = loadQuota(vaultPath);
    expect(reloaded.config.maxKeys).toBe(10);
  });
});

describe('setQuota', () => {
  it('updates specific fields', () => {
    const store = setQuota(vaultPath, { maxKeys: 50 });
    expect(store.config.maxKeys).toBe(50);
    expect(store.config.maxValueLength).toBe(4096);
  });
});

describe('checkQuota', () => {
  const config: QuotaConfig = { maxKeys: 3, maxValueLength: 10, maxTotalSize: 1000 };

  it('passes when within limits', () => {
    const result = checkQuota({ A: 'val', B: 'val2' }, config);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects too many keys', () => {
    const result = checkQuota({ A: '1', B: '2', C: '3', D: '4' }, config);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('Key count'))).toBe(true);
  });

  it('detects value too long', () => {
    const result = checkQuota({ KEY: 'a'.repeat(20) }, config);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('KEY'))).toBe(true);
  });
});

describe('formatQuota', () => {
  it('includes config fields', () => {
    const store = loadQuota(vaultPath);
    const output = formatQuota(store);
    expect(output).toContain('Max Keys');
    expect(output).toContain('Max Value Len');
  });

  it('includes violations when result provided', () => {
    const store = loadQuota(vaultPath);
    const result = { passed: false, violations: ['Too many keys'] };
    const output = formatQuota(store, result);
    expect(output).toContain('Too many keys');
    expect(output).toContain('✖');
  });
});
