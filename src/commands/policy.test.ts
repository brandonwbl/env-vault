import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getPolicyPath, loadPolicy, savePolicy, addRule, removeRule,
  enforcePolicy, formatPolicyViolations
} from './policy';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadPolicy returns empty policy if no file', () => {
  const p = loadPolicy(vaultPath);
  expect(p.rules).toEqual([]);
});

test('addRule persists rule', () => {
  addRule(vaultPath, { pattern: '^DB_', required: true });
  const p = loadPolicy(vaultPath);
  expect(p.rules).toHaveLength(1);
  expect(p.rules[0].pattern).toBe('^DB_');
});

test('addRule replaces existing rule with same pattern', () => {
  addRule(vaultPath, { pattern: '^DB_', minLength: 5 });
  addRule(vaultPath, { pattern: '^DB_', minLength: 10 });
  const p = loadPolicy(vaultPath);
  expect(p.rules).toHaveLength(1);
  expect(p.rules[0].minLength).toBe(10);
});

test('removeRule removes rule', () => {
  addRule(vaultPath, { pattern: '^DB_' });
  removeRule(vaultPath, '^DB_');
  const p = loadPolicy(vaultPath);
  expect(p.rules).toHaveLength(0);
});

test('enforcePolicy detects missing required key', () => {
  const policy = { rules: [{ pattern: '^DB_HOST$', required: true }], createdAt: '', updatedAt: '' };
  const violations = enforcePolicy({ API_KEY: 'abc' }, policy);
  expect(violations).toHaveLength(1);
  expect(violations[0].reason).toMatch(/required/);
});

test('enforcePolicy detects minLength violation', () => {
  const policy = { rules: [{ pattern: '^SECRET', minLength: 20 }], createdAt: '', updatedAt: '' };
  const violations = enforcePolicy({ SECRET_KEY: 'short' }, policy);
  expect(violations).toHaveLength(1);
  expect(violations[0].reason).toMatch(/too short/);
});

test('enforcePolicy passes with valid entries', () => {
  const policy = { rules: [{ pattern: '^DB_HOST$', required: true, minLength: 3 }], createdAt: '', updatedAt: '' };
  const violations = enforcePolicy({ DB_HOST: 'localhost' }, policy);
  expect(violations).toHaveLength(0);
});

test('formatPolicyViolations returns no-violation message', () => {
  expect(formatPolicyViolations([])).toBe('No policy violations found.');
});

test('formatPolicyViolations lists violations', () => {
  const rule = { pattern: '^X' };
  const result = formatPolicyViolations([{ key: 'X_KEY', rule, reason: 'too short' }]);
  expect(result).toContain('[VIOLATION]');
  expect(result).toContain('X_KEY');
});
