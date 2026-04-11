import { readVault } from '../crypto';

export interface AllTagsOptions {
  vaultPath: string;
  password: string;
  verbose?: boolean;
}

export function formatAllTags(tagMap: Record<string, string[]>): string {
  const tags = Object.keys(tagMap).sort();
  if (tags.length === 0) return 'No tags found in vault.';

  return tags
    .map((tag) => {
      const keys = tagMap[tag].sort();
      return `[${tag}] (${keys.length} ${keys.length === 1 ? 'entry' : 'entries'})\n  ${keys.join('\n  ')}`;
    })
    .join('\n');
}

export async function tagsCommand(options: AllTagsOptions): Promise<void> {
  const { vaultPath, password, verbose = false } = options;

  const vault = await readVault(vaultPath, password);

  const tagMap: Record<string, string[]> = {};

  for (const [key, entry] of Object.entries(vault.entries) as [string, any][]) {
    const entryTags: string[] = entry.tags || [];
    for (const tag of entryTags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(key);
    }
  }

  if (verbose) {
    console.log(formatAllTags(tagMap));
  } else {
    const tagNames = Object.keys(tagMap).sort();
    if (tagNames.length === 0) {
      console.log('No tags found in vault.');
    } else {
      tagNames.forEach((t) => console.log(t));
    }
  }
}
