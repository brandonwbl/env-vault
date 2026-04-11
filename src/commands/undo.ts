import { readVault, writeVault } from '../crypto';
import { loadHistory, saveHistory, appendHistoryEntry } from './history';

export async function undoCommand(
  vaultPath: string,
  password: string
): Promise<string> {
  const vault = await readVault(vaultPath, password);
  const history = loadHistory(vaultPath);

  if (history.entries.length === 0) {
    return 'Nothing to undo.';
  }

  const last = history.entries[history.entries.length - 1];
  const env = vault.data as Record<string, string>;

  if (last.action === 'set') {
    if (last.oldValue === undefined) {
      delete env[last.key];
    } else {
      env[last.key] = last.oldValue;
    }
    vault.data = env;
    await writeVault(vaultPath, vault);

    const undoEntry = {
      action: 'undo',
      key: last.key,
      oldValue: last.newValue,
      newValue: last.oldValue,
    };
    history.entries.pop();
    saveHistory(vaultPath, history);
    appendHistoryEntry(vaultPath, undoEntry);

    return `Undid SET for key "${last.key}".`;
  }

  if (last.action === 'remove') {
    if (last.oldValue !== undefined) {
      env[last.key] = last.oldValue;
    }
    vault.data = env;
    await writeVault(vaultPath, vault);

    const undoEntry = {
      action: 'undo',
      key: last.key,
      oldValue: undefined,
      newValue: last.oldValue,
    };
    history.entries.pop();
    saveHistory(vaultPath, history);
    appendHistoryEntry(vaultPath, undoEntry);

    return `Undid REMOVE for key "${last.key}".`;
  }

  return `Cannot undo action "${last.action}".`;
}
