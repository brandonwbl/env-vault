import { readVault, deriveKey } from '../crypto';
import { VaultData } from '../crypto/vault';

export interface SearchResult {
  key: string;
  value: string;
  matchType: 'key' | 'value' | 'both';
}

export async function searchCommand(
  vaultPath: string,
  password: string,
  query: string,
  options: { caseSensitive?: boolean; keysOnly?: boolean; valuesOnly?: boolean } = {}
): Promise<SearchResult[]> {
  const { caseSensitive = false, keysOnly = false, valuesOnly = false } = options;

  if (keysOnly && valuesOnly) {
    throw new Error('Options keysOnly and valuesOnly cannot both be true.');
  }

  if (!query || query.trim() === '') {
    throw new Error('Search query must not be empty.');
  }

  const vault = await readVault(vaultPath);
  const key = await deriveKey(password, vault.salt);
  const entries: VaultData = JSON.parse(
    (await import('../crypto/encryption')).decrypt(vault.data, key)
  );

  const normalize = (str: string) => (caseSensitive ? str : str.toLowerCase());
  const normalizedQuery = normalize(query);

  const results: SearchResult[] = [];

  for (const [envKey, envValue] of Object.entries(entries)) {
    const keyMatch = !valuesOnly && normalize(envKey).includes(normalizedQuery);
    const valueMatch = !keysOnly && normalize(envValue).includes(normalizedQuery);

    if (keyMatch || valueMatch) {
      results.push({
        key: envKey,
        value: envValue,
        matchType: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
      });
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return `No results found for "${query}".`;
  }

  const lines = results.map((r) => {
    const matchLabel = `[${r.matchType}]`;
    return `${matchLabel.padEnd(8)} ${r.key}=${r.value}`;
  });

  return [`Found ${results.length} result(s) for "${query}":`, ...lines].join('\n');
}
