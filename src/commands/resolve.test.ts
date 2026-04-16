import { resolveEntries, formatResolved } from './resolve';
import { VaultEntry } from '../crypto/vault';

function makeEntry(key: string, value: string): VaultEntry {
  return { key, value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

describe('resolveEntries', () => {
  const entries: VaultEntry[] = [
    makeEntry('DB_HOST', 'localhost'),
    makeEntry('DB_PORT', '5432'),
    makeEntry('production:DB_HOST', 'prod.db.example.com'),
    makeEntry('production:DB_PORT', '5433'),
    makeEntry('staging:DB_HOST', 'staging.db.example.com'),
  ];

  it('returns base entries when env has no overrides', () => {
    const result = resolveEntries(entries, 'development');
    expect(result.get('DB_HOST')).toBe('localhost');
    expect(result.get('DB_PORT')).toBe('5432');
  });

  it('applies env-specific overrides over base values', () => {
    const result = resolveEntries(entries, 'production');
    expect(result.get('DB_HOST')).toBe('prod.db.example.com');
    expect(result.get('DB_PORT')).toBe('5433');
  });

  it('applies partial env overrides and keeps base for non-overridden keys', () => {
    const result = resolveEntries(entries, 'staging');
    expect(result.get('DB_HOST')).toBe('staging.db.example.com');
    expect(result.get('DB_PORT')).toBe('5432');
  });

  it('does not include env-namespaced keys as top-level keys', () => {
    const result = resolveEntries(entries, 'development');
    expect(result.has('production:DB_HOST')).toBe(false);
    expect(result.has('staging:DB_HOST')).toBe(false);
  });

  it('uses process.env fallback when useFallback is true and value is empty', () => {
    const sparse: VaultEntry[] = [makeEntry('MISSING_KEY', '')];
    process.env['MISSING_KEY'] = 'from-process';
    const result = resolveEntries(sparse, 'development', true);
    expect(result.get('MISSING_KEY')).toBe('from-process');
    delete process.env['MISSING_KEY'];
  });

  it('does not override non-empty values with process.env when fallback enabled', () => {
    process.env['DB_HOST'] = 'should-not-use';
    const result = resolveEntries(entries, 'development', true);
    expect(result.get('DB_HOST')).toBe('localhost');
    delete process.env['DB_HOST'];
  });
});

describe('formatResolved', () => {
  it('formats resolved map as sorted dotenv lines', () => {
    const map = new Map([['Z_KEY', 'last'], ['A_KEY', 'first']]);
    const output = formatResolved(map);
    expect(output).toBe('A_KEY=first\nZ_KEY=last');
  });

  it('returns empty string for empty map', () => {
    expect(formatResolved(new Map())).toBe('');
  });
});
