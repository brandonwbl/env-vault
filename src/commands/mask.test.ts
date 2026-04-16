import { maskValue, applyMaskRules, formatMasked } from './mask';
import { VaultEntry } from '../crypto';

function makeEntry(key: string, value: string): VaultEntry {
  return { key, value, createdAt: Date.now(), updatedAt: Date.now() };
}

describe('maskValue', () => {
  it('returns **** for pattern ****', () => {
    expect(maskValue('supersecret', '****')).toBe('****');
  });

  it('masks all but first 4 chars', () => {
    expect(maskValue('abcdefgh', 'first4')).toBe('abcd****');
  });

  it('masks all but last 4 chars', () => {
    expect(maskValue('abcdefgh', 'last4')).toBe('****efgh');
  });

  it('returns **** for short value with first4', () => {
    expect(maskValue('ab', 'first4')).toBe('****');
  });

  it('returns **** for unknown pattern', () => {
    expect(maskValue('value', 'unknown')).toBe('****');
  });
});

describe('applyMaskRules', () => {
  const entries = [
    makeEntry('API_KEY', 'supersecret123'),
    makeEntry('DB_HOST', 'localhost'),
  ];

  it('masks entries matching rules', () => {
    const results = applyMaskRules(entries, [{ key: 'API_KEY', pattern: 'last4' }]);
    expect(results[0].masked).toBe(true);
    expect(results[0].value).toBe('**********123');
    expect(results[1].masked).toBe(false);
    expect(results[1].value).toBe('localhost');
  });

  it('returns all unmasked when no rules match', () => {
    const results = applyMaskRules(entries, []);
    expect(results.every((r) => !r.masked)).toBe(true);
  });
});

describe('formatMasked', () => {
  it('returns no entries message for empty array', () => {
    expect(formatMasked([])).toBe('No entries.');
  });

  it('formats masked and unmasked entries', () => {
    const results = [
      { key: 'API_KEY', value: '****', masked: true },
      { key: 'DB_HOST', value: 'localhost', masked: false },
    ];
    const output = formatMasked(results);
    expect(output).toContain('API_KEY=**** [masked]');
    expect(output).toContain('DB_HOST=localhost');
    expect(output).not.toContain('DB_HOST=localhost [masked]');
  });
});
