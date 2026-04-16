import { applyRedact, redactEntries, formatRedactResult, RedactRule } from './redact';
import { VaultEntry } from '../crypto';

function makeEntry(key: string, value: string): VaultEntry {
  return { key, value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

describe('applyRedact', () => {
  it('replaces pattern matches', () => {
    const rules: RedactRule[] = [{ pattern: '\\d+', replacement: '***' }];
    expect(applyRedact('abc123def456', rules)).toBe('abc***def***');
  });

  it('returns original if no pattern matches', () => {
    const rules: RedactRule[] = [{ pattern: 'xyz', replacement: '***' }];
    expect(applyRedact('hello', rules)).toBe('hello');
  });

  it('applies multiple rules in order', () => {
    const rules: RedactRule[] = [
      { pattern: 'foo', replacement: 'BAR' },
      { pattern: 'BAR', replacement: '***' },
    ];
    expect(applyRedact('foo', rules)).toBe('***');
  });
});

describe('redactEntries', () => {
  const entries = [
    makeEntry('API_KEY', 'secret-abc123'),
    makeEntry('HOST', 'localhost'),
  ];

  it('redacts matching entries', () => {
    const rules: RedactRule[] = [{ pattern: 'secret-\\w+', replacement: '[REDACTED]' }];
    const results = redactEntries(entries, rules);
    expect(results[0].changed).toBe(true);
    expect(results[0].redacted).toBe('[REDACTED]');
    expect(results[1].changed).toBe(false);
  });

  it('applies key-scoped rules only to matching key', () => {
    const rules: RedactRule[] = [{ key: 'HOST', pattern: 'localhost', replacement: '***' }];
    const results = redactEntries(entries, rules);
    expect(results[1].changed).toBe(true);
    expect(results[0].changed).toBe(false);
  });
});

describe('formatRedactResult', () => {
  it('returns message when nothing changed', () => {
    const results = [{ key: 'A', original: 'x', redacted: 'x', changed: false }];
    expect(formatRedactResult(results)).toBe('No values were redacted.');
  });

  it('lists changed entries', () => {
    const results = [{ key: 'A', original: 'secret', redacted: '[REDACTED]', changed: true }];
    const out = formatRedactResult(results);
    expect(out).toContain('Redacted 1 value(s)');
    expect(out).toContain('A');
    expect(out).toContain('[REDACTED]');
  });
});
