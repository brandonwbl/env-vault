import { VaultEntry } from '../crypto';

export interface SchemaField {
  key: string;
  required: boolean;
  pattern?: string;
  description?: string;
}

export interface Schema {
  fields: SchemaField[];
}

export interface SchemaViolation {
  key: string;
  reason: string;
}

export function validateSchema(entries: VaultEntry[], schema: Schema): SchemaViolation[] {
  const violations: SchemaViolation[] = [];
  const entryMap = new Map(entries.map(e => [e.key, e.value]));

  for (const field of schema.fields) {
    if (field.required && !entryMap.has(field.key)) {
      violations.push({ key: field.key, reason: 'required key is missing' });
      continue;
    }
    if (field.pattern && entryMap.has(field.key)) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(entryMap.get(field.key)!)) {
        violations.push({ key: field.key, reason: `value does not match pattern: ${field.pattern}` });
      }
    }
  }

  return violations;
}

export function formatSchemaViolations(violations: SchemaViolation[]): string {
  if (violations.length === 0) return 'Schema validation passed.';
  const lines = violations.map(v => `  [FAIL] ${v.key}: ${v.reason}`);
  return `Schema violations (${violations.length}):\n${lines.join('\n')}`;
}

export function schemaFromJson(raw: unknown): Schema {
  const obj = raw as { fields?: unknown[] };
  if (!obj || !Array.isArray(obj.fields)) throw new Error('Invalid schema format');
  const fields: SchemaField[] = obj.fields.map((f: any) => ({
    key: String(f.key),
    required: Boolean(f.required),
    pattern: f.pattern ? String(f.pattern) : undefined,
    description: f.description ? String(f.description) : undefined,
  }));
  return { fields };
}
