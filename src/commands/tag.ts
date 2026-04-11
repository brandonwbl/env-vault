import { readVault, writeVault } from '../crypto';

export interface TagOptions {
  vaultPath: string;
  password: string;
  key: string;
  tags: string[];
  remove?: boolean;
}

export async function tagCommand(options: TagOptions): Promise<void> {
  const { vaultPath, password, key, tags, remove = false } = options;

  const vault = await readVault(vaultPath, password);

  if (!Object.prototype.hasOwnProperty.call(vault.entries, key)) {
    throw new Error(`Key "${key}" not found in vault`);
  }

  const entry = vault.entries[key];

  if (!entry.tags) {
    entry.tags = [];
  }

  if (remove) {
    entry.tags = entry.tags.filter((t: string) => !tags.includes(t));
  } else {
    const newTags = tags.filter((t) => !entry.tags!.includes(t));
    entry.tags = [...entry.tags, ...newTags];
  }

  entry.updatedAt = new Date().toISOString();
  vault.entries[key] = entry;

  await writeVault(vaultPath, password, vault);

  const action = remove ? 'Removed tags from' : 'Tagged';
  console.log(`${action} "${key}": [${entry.tags.join(', ')}]`);
}

export async function listByTagCommand(options: {
  vaultPath: string;
  password: string;
  tag: string;
}): Promise<void> {
  const { vaultPath, password, tag } = options;

  const vault = await readVault(vaultPath, password);

  const matches = Object.entries(vault.entries).filter(
    ([, entry]: [string, any]) => entry.tags && entry.tags.includes(tag)
  );

  if (matches.length === 0) {
    console.log(`No entries found with tag "${tag}"`);
    return;
  }

  console.log(`Entries tagged with "${tag}":`);
  matches.forEach(([k]: [string, any]) => console.log(`  ${k}`));
}
