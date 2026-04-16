import { applyTransform, transformEntries, formatTransformResult } from './transform';
import { VaultEntry } from '../crypto';

function makeEntry(key: string, value: string): VaultEntry {
  return { key, value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

describe('applyTransform', () => {
  it('uppercases value', () => {
    expect(applyTransform('hello', { op: 'uppercase' })).toBe('HELLO');
  });

  it('lowercases value', () => {
    expect(applyTransform('WORLD', { op: 'lowercase' })).toBe('world');
  });

  it('trims whitespace', () => {
    expect(applyTransform('  hi  ', { op: 'trim' })).toBe('hi');
  });

  it('base64 encodes', () => {
    expect(applyTransform('secret', { op: 'base64encode' })).toBe(Buffer.from('secret').toString('base64'));
  });

  it('base64 decodes', () => {
    const encoded = Buffer.from('secret').toString('base64');
    expect(applyTransform(encoded, { op: 'base64decode' })).toBe('secret');
  });

  it('adds prefix', () => {
    expect(applyTransform('value', { op: 'prefix', arg: 'PRE_' })).toBe('PRE_value');
  });

  it('adds suffix', () => {
    expect(applyTransform('value', { op: 'suffix', arg: '_SUF' })).toBe('value_SUF');
  });
});

describe('transformEntries', () => {
  const entries = [
    makeEntry('API_KEY', 'abc123'),
    makeEntry('DB_PASS', 'secret'),
    makeEntry('HOST', 'localhost'),
  ];

  it('transforms only specified keys', () => {
    const { entries: result, changed } = transformEntries(entries, ['API_KEY'], [{ op: 'uppercase' }]);
    expect(result.find(e => e.key === 'API_KEY')?.value).toBe('ABC123');
    expect(result.find(e => e.key === 'DB_PASS')?.value).toBe('secret');
    expect(changed).toEqual(['API_KEY']);
  });

  it('applies multiple rules in order', () => {
    const { entries: result } = transformEntries(entries, ['HOST'], [
      { op: 'prefix', arg: 'https://' },
      { op: 'suffix', arg: ':5432' },
    ]);
    expect(result.find(e => e.key === 'HOST')?.value).toBe('https://localhost:5432');
  });

  it('returns empty changed when no values differ', () => {
    const { changed } = transformEntries(entries, ['HOST'], [{ op: 'trim' }]);
    expect(changed).toHaveLength(0);
  });
});

describe('formatTransformResult', () => {
  it('reports no changes', () => {
    expect(formatTransformResult([], 5)).toBe('No entries were modified.');
  });

  it('lists changed keys', () => {
    const out = formatTransformResult(['API_KEY', 'DB_PASS'], 5);
    expect(out).toContain('2/5');
    expect(out).toContain('API_KEY');
    expect(out).toContain('DB_PASS');
  });
});
