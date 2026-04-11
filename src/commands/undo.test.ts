import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { undoCommand } from './undo';
import { createVault, writeVault, readVault } from '../crypto';
import { appendHistoryEntry, getHistoryPath, saveHistory } from './history';

const tmpVaultPath = path.join(os.tmpdir(), 'test-undo-vault.json');
const password = 'undo-test-password';

async function setupVault(data: Record<string, string> = {}) {
  const vault = await createVault(password);
  vault.data = data;
  await writeVault(tmpVaultPath, vault);
}

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
  const hp = getHistoryPath(tmpVaultPath);
  if (fs.existsSync(hp)) fs.unlinkSync(hp);
});

describe('undoCommand', () => {
  it('returns nothing-to-undo when history is empty', async () => {
    await setupVault();
    const result = await undoCommand(tmpVaultPath, password);
    expect(result).toBe('Nothing to undo.');
  });

  it('undoes a set action by restoring old value', async () => {
    await setupVault({ API_KEY: 'new-value' });
    appendHistoryEntry(tmpVaultPath, {
      action: 'set',
      key: 'API_KEY',
      oldValue: 'old-value',
      newValue: 'new-value',
    });
    const result = await undoCommand(tmpVaultPath, password);
    expect(result).toContain('Undid SET');
    expect(result).toContain('API_KEY');
    const vault = await readVault(tmpVaultPath, password);
    expect((vault.data as Record<string, string>)['API_KEY']).toBe('old-value');
  });

  it('undoes a set action by deleting key when no old value', async () => {
    await setupVault({ NEW_KEY: 'value' });
    appendHistoryEntry(tmpVaultPath, {
      action: 'set',
      key: 'NEW_KEY',
      newValue: 'value',
    });
    await undoCommand(tmpVaultPath, password);
    const vault = await readVault(tmpVaultPath, password);
    expect((vault.data as Record<string, string>)['NEW_KEY']).toBeUndefined();
  });

  it('undoes a remove action by restoring the key', async () => {
    await setupVault({});
    appendHistoryEntry(tmpVaultPath, {
      action: 'remove',
      key: 'DB_PASS',
      oldValue: 'secret',
    });
    const result = await undoCommand(tmpVaultPath, password);
    expect(result).toContain('Undid REMOVE');
    const vault = await readVault(tmpVaultPath, password);
    expect((vault.data as Record<string, string>)['DB_PASS']).toBe('secret');
  });

  it('returns cannot-undo for unsupported action types', async () => {
    await setupVault();
    saveHistory(tmpVaultPath, {
      entries: [
        { timestamp: new Date().toISOString(), action: 'undo', key: 'X' },
      ],
    });
    const result = await undoCommand(tmpVaultPath, password);
    expect(result).toContain('Cannot undo');
  });
});
