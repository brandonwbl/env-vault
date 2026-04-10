import * as fs from 'fs';
import * as path from 'path';
import { readVault, writeVault } from '../crypto';
import { parseEnv } from '../env';

export interface ImportOptions {
  vaultPath: string;
  envFilePath: string;
  password: string;
  overwrite?: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  keys: string[];
}

export async function importEnvFile(options: ImportOptions): Promise<ImportResult> {
  const { vaultPath, envFilePath, password, overwrite = false } = options;

  const resolvedEnvPath = path.resolve(envFilePath);
  if (!fs.existsSync(resolvedEnvPath)) {
    throw new Error(`Env file not found: ${resolvedEnvPath}`);
  }

  const envContent = fs.readFileSync(resolvedEnvPath, 'utf-8');
  const parsedEnv = parseEnv(envContent);

  if (Object.keys(parsedEnv).length === 0) {
    throw new Error('No valid environment variables found in the file');
  }

  const vault = await readVault(vaultPath, password);

  let imported = 0;
  let skipped = 0;
  const importedKeys: string[] = [];

  for (const [key, value] of Object.entries(parsedEnv)) {
    if (vault.entries[key] !== undefined && !overwrite) {
      skipped++;
      continue;
    }
    vault.entries[key] = value;
    imported++;
    importedKeys.push(key);
  }

  if (imported > 0) {
    vault.updatedAt = new Date().toISOString();
    await writeVault(vaultPath, vault, password);
  }

  return { imported, skipped, keys: importedKeys };
}
