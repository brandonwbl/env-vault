import { readVault, deserializeVault } from '../crypto';
import { VaultEntry } from '../crypto/vault';

export interface ResolveOptions {
  env?: string;
  fallback?: boolean;
}

/**
 * Resolves the final value of a key by applying profile/env layering.
 * Precedence: env-specific key > base key > fallback (process.env)
 */
export function resolveEntries(
  entries: VaultEntry[],
  env: string,
  useFallback = false
): Map<string, string> {
  const base = new Map<string, string>();
  const envOverrides = new Map<string, string>();

  for (const entry of entries) {
    const match = entry.key.match(/^([^:]+):(.+)$/);
    if (match) {
      const [, entryEnv, baseKey] = match;
      if (entryEnv === env) {
        envOverrides.set(baseKey, entry.value);
      }
    } else {
      base.set(entry.key, entry.value);
    }
  }

  const resolved = new Map<string, string>(base);
  for (const [k, v] of envOverrides) {
    resolved.set(k, v);
  }

  if (useFallback) {
    for (const [k] of resolved) {
      if (!resolved.get(k) && process.env[k] !== undefined) {
        resolved.set(k, process.env[k]!);
      }
    }
  }

  return resolved;
}

export function formatResolved(resolved: Map<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of [...resolved.entries()].sort()) {
    lines.push(`${key}=${value}`);
  }
  return lines.join('\n');
}

export async function runResolve(
  vaultPath: string,
  password: string,
  env: string,
  options: ResolveOptions = {}
): Promise<void> {
  const raw = await readVault(vaultPath);
  const vault = await deserializeVault(raw, password);
  const resolved = resolveEntries(vault.entries, env, options.fallback ?? false);
  console.log(formatResolved(resolved));
}
