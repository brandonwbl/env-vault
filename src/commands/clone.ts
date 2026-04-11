import { readVault, writeVault, deserializeVault, serializeVault } from '../crypto';

interface CloneOptions {
  sourcePath: string;
  destPath: string;
  sourcePassword: string;
  destPassword?: string;
  keys?: string[];
}

export async function clone(options: CloneOptions): Promise<void> {
  const { sourcePath, destPath, sourcePassword, destPassword, keys } = options;

  const sourceRaw = await readVault(sourcePath);
  const sourceVault = await deserializeVault(sourceRaw, sourcePassword);

  let entries = { ...sourceVault.entries };

  if (keys && keys.length > 0) {
    const filtered: Record<string, string> = {};
    for (const key of keys) {
      if (key in entries) {
        filtered[key] = entries[key];
      } else {
        throw new Error(`Key "${key}" not found in source vault`);
      }
    }
    entries = filtered;
  }

  const targetPassword = destPassword ?? sourcePassword;

  let destVault: { entries: Record<string, string>; createdAt: string; updatedAt: string };

  try {
    const destRaw = await readVault(destPath);
    const existing = await deserializeVault(destRaw, targetPassword);
    destVault = {
      ...existing,
      entries: { ...existing.entries, ...entries },
      updatedAt: new Date().toISOString(),
    };
  } catch {
    destVault = {
      entries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const serialized = await serializeVault(destVault, targetPassword);
  await writeVault(destPath, serialized);
}
