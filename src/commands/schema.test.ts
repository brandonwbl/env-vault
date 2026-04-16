import { validateSchema, formatSchemaViolations, schemaFromJson } from './schema';
import { VaultEntry } from '../crypto';

const makeEntry = (key: string, value: string): VaultEntry => ({ key, value, createdAt: Date.now(), updatedAt: Date.now() });

describe('schemaFromJson', () => {
  it('parses valid schema', () => {
    const raw = { fields: [{ key: 'API_KEY', required: true, pattern: '^sk-' }] };
    const schema = schemaFromJson(raw);
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].key).toBe('API_KEY');
    expect(schema.fields[0].required).toBe(true);
  });

  it('throws on invalid schema', () => {
    expect(() => schemaFromJson({})).toThrow('Invalid schema format');
  });
});

describe('validateSchema', () => {
  const schema = schemaFromJson({
    fields: [
      { key: 'API_KEY', required: true, pattern: '^sk-' },
      { key: 'PORT', required: false, pattern: '^\\d+$' },
      { key: 'APP_NAME', required: true },
    ],
  });

  it('returns no violations for valid entries', () => {
    const entries = [
      makeEntry('API_KEY', 'sk-abc123'),
      makeEntry('APP_NAME', 'myapp'),
    ];
    expect(validateSchema(entries, schema)).toHaveLength(0);
  });

  it('detects missing required key', () => {
    const entries = [makeEntry('API_KEY', 'sk-abc')];
    const v = validateSchema(entries, schema);
    expect(v.some(x => x.key === 'APP_NAME' && x.reason.includes('missing'))).toBe(true);
  });

  it('detects pattern mismatch', () => {
    const entries = [
      makeEntry('API_KEY', 'bad-key'),
      makeEntry('APP_NAME', 'myapp'),
    ];
    const v = validateSchema(entries, schema);
    expect(v.some(x => x.key === 'API_KEY' && x.reason.includes('pattern'))).toBe(true);
  });

  it('ignores optional missing keys', () => {
    const entries = [makeEntry('API_KEY', 'sk-x'), makeEntry('APP_NAME', 'app')];
    const v = validateSchema(entries, schema);
    expect(v.some(x => x.key === 'PORT')).toBe(false);
  });
});

describe('formatSchemaViolations', () => {
  it('returns pass message when no violations', () => {
    expect(formatSchemaViolations([])).toBe('Schema validation passed.');
  });

  it('lists violations', () => {
    const v = [{ key: 'API_KEY', reason: 'required key is missing' }];
    const out = formatSchemaViolations(v);
    expect(out).toContain('API_KEY');
    expect(out).toContain('required key is missing');
    expect(out).toContain('1');
  });
});
