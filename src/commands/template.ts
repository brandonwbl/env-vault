import { readVault, writeVault } from '../crypto';
import { serializeEnv } from '../env';

export interface TemplateEntry {
  key: string;
  description?: string;
  required: boolean;
  example?: string;
}

export function extractTemplate(entries: Record<string, string>): TemplateEntry[] {
  return Object.keys(entries).map((key) => ({
    key,
    required: true,
    example: entries[key],
  }));
}

export function formatTemplate(entries: TemplateEntry[]): string {
  return entries
    .map((e) => {
      const lines: string[] = [];
      if (e.description) lines.push(`# ${e.description}`);
      if (e.example) lines.push(`# example: ${e.example}`);
      lines.push(`${e.key}=`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export async function templateCommand(
  vaultPath: string,
  password: string,
  outputPath?: string
): Promise<string> {
  const vault = await readVault(vaultPath, password);
  const entries = vault.entries ?? {};
  const template = extractTemplate(entries);
  const rendered = formatTemplate(template);

  if (outputPath) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, rendered, 'utf-8');
  }

  return rendered;
}

export async function applyTemplate(
  vaultPath: string,
  password: string,
  values: Record<string, string>,
  strict = false
): Promise<void> {
  const vault = await readVault(vaultPath, password);
  const entries = vault.entries ?? {};
  const template = extractTemplate(entries);

  if (strict) {
    const missing = template
      .filter((e) => e.required && !(e.key in values))
      .map((e) => e.key);
    if (missing.length > 0) {
      throw new Error(`Missing required keys: ${missing.join(', ')}`);
    }
  }

  const merged = { ...entries, ...values };
  vault.entries = merged;
  await writeVault(vaultPath, password, vault);
}
