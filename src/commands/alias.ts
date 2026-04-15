import * as fs from 'fs';
import * as path from 'path';

export interface AliasMap {
  [alias: string]: string;
}

export function getAliasPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.aliases.json`);
}

export function loadAliases(aliasPath: string): AliasMap {
  if (!fs.existsSync(aliasPath)) return {};
  try {
    const raw = fs.readFileSync(aliasPath, 'utf-8');
    return JSON.parse(raw) as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(aliasPath: string, aliases: AliasMap): void {
  fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2), 'utf-8');
}

export function setAlias(aliases: AliasMap, alias: string, key: string): AliasMap {
  if (!alias || !key) throw new Error('Alias and key must be non-empty strings.');
  return { ...aliases, [alias]: key };
}

export function removeAlias(aliases: AliasMap, alias: string): AliasMap {
  if (!(alias in aliases)) throw new Error(`Alias "${alias}" not found.`);
  const updated = { ...aliases };
  delete updated[alias];
  return updated;
}

export function resolveAlias(aliases: AliasMap, aliasOrKey: string): string {
  return aliases[aliasOrKey] ?? aliasOrKey;
}

export function formatAliasList(aliases: AliasMap): string {
  const entries = Object.entries(aliases);
  if (entries.length === 0) return 'No aliases defined.';
  return entries.map(([alias, key]) => `  ${alias} -> ${key}`).join('\n');
}
