import { validateEntries, formatValidateResult, ValidationResult } from './validate';
import { VaultEntry } from '../crypto/vault';

const makeEntry = (key: string, value: string): VaultEntry => ({
  key,
  value,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('validateEntries', () => {
  it('returns no issues for valid entries', () => {
    const entries = [makeEntry('DATABASE_URL', 'postgres://localhost/db')];
    expect(validateEntries(entries)).toHaveLength(0);
  });

  it('flags empty value', () => {
    const entries = [makeEntry('API_KEY', '   ')];
    const results = validateEntries(entries);
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('flags lowercase key', () => {
    const entries = [makeEntry('api_key', 'secret')];
    const results = validateEntries(entries);
    expect(results.some((r) => r.rule === 'valid-key-format')).toBe(true);
  });

  it('flags key with whitespace', () => {
    const entries = [makeEntry('MY KEY', 'value')];
    const results = validateEntries(entries);
    expect(results.some((r) => r.rule === 'no-whitespace-in-key')).toBe(true);
  });

  it('flags value exceeding max length', () => {
    const entries = [makeEntry('BIG_VALUE', 'x'.repeat(4097))];
    const results = validateEntries(entries);
    expect(results.some((r) => r.rule === 'reasonable-value-length')).toBe(true);
  });

  it('reports multiple issues for a single entry', () => {
    const entries = [makeEntry('bad key', '')];
    const results = validateEntries(entries);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('validates multiple entries independently', () => {
    const entries = [
      makeEntry('VALID_KEY', 'ok'),
      makeEntry('bad', ''),
    ];
    const results = validateEntries(entries);
    expect(results.every((r) => r.key === 'bad')).toBe(true);
  });
});

describe('formatValidateResult', () => {
  it('returns success message when no issues', () => {
    expect(formatValidateResult([])).toBe('✔ All entries are valid.');
  });

  it('includes issue count and details', () => {
    const results: ValidationResult[] = [
      { key: 'BAD_KEY', rule: 'no-empty-value', message: 'Value must not be empty or whitespace' },
    ];
    const output = formatValidateResult(results);
    expect(output).toContain('1 validation issue');
    expect(output).toContain('BAD_KEY');
    expect(output).toContain('no-empty-value');
  });
});
