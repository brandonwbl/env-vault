import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getHistoryPath,
  loadHistory,
  saveHistory,
  appendHistoryEntry,
  formatHistory,
  historyCommand,
  HistoryEntry,
} from './history';
import { createVault, writeVault } from '../crypto';

const tmpVaultPath = path.join(os.tmpdir(), 'test-history-vault.json');
const password = 'test-password-history';

async function setupVault() {
  const vault = await createVault(password);
  await writeVault(tmpVaultPath, vault);
}

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
  const hp = getHistoryPath(tmpVaultPath);
  if (fs.existsSync(hp)) fs.unlinkSync(hp);
});

describe('getHistoryPath', () => {
  it('returns a sibling .history.json file', () => {
    const hp = getHistoryPath('/some/dir/vault.json');
    expect(hp).toBe('/some/dir/vault.history.json');
  });
});

describe('loadHistory / saveHistory', () => {
  it('returns empty entries when no history file exists', () => {
    const history = loadHistory(tmpVaultPath);
    expect(history.entries).toEqual([]);
  });

  it('persists and loads history entries', () => {
    const entry: HistoryEntry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      action: 'set',
      key: 'FOO',
      newValue: 'bar',
    };
    saveHistory(tmpVaultPath, { entries: [entry] });
    const loaded = loadHistory(tmpVaultPath);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].key).toBe('FOO');
  });
});

describe('appendHistoryEntry', () => {
  it('appends an entry with a timestamp', () => {
    appendHistoryEntry(tmpVaultPath, { action: 'set', key: 'API_KEY', newValue: 'abc' });
    const history = loadHistory(tmpVaultPath);
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0].action).toBe('set');
    expect(history.entries[0].timestamp).toBeTruthy();
  });
});

describe('formatHistory', () => {
  it('returns a no-history message for empty entries', () => {
    expect(formatHistory([])).toBe('No history found.');
  });

  it('formats set entries with old and new values', () => {
    const entries: HistoryEntry[] = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'set', key: 'X', oldValue: 'old', newValue: 'new' },
    ];
    const result = formatHistory(entries);
    expect(result).toContain('SET');
    expect(result).toContain('X=new');
    expect(result).toContain('was: old');
  });

  it('formats remove entries', () => {
    const entries: HistoryEntry[] = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'remove', key: 'Y', oldValue: 'val' },
    ];
    expect(formatHistory(entries)).toContain('REMOVE');
  });
});

describe('historyCommand', () => {
  it('returns formatted history for a vault', async () => {
    await setupVault();
    appendHistoryEntry(tmpVaultPath, { action: 'set', key: 'DB_URL', newValue: 'postgres://localhost' });
    const result = await historyCommand(tmpVaultPath, password);
    expect(result).toContain('SET');
    expect(result).toContain('DB_URL');
  });

  it('filters by key when option provided', async () => {
    await setupVault();
    appendHistoryEntry(tmpVaultPath, { action: 'set', key: 'FOO', newValue: '1' });
    appendHistoryEntry(tmpVaultPath, { action: 'set', key: 'BAR', newValue: '2' });
    const result = await historyCommand(tmpVaultPath, password, { key: 'FOO' });
    expect(result).toContain('FOO');
    expect(result).not.toContain('BAR');
  });

  it('limits results when limit option provided', async () => {
    await setupVault();
    for (let i = 0; i < 5; i++) {
      appendHistoryEntry(tmpVaultPath, { action: 'set', key: `K${i}`, newValue: `${i}` });
    }
    const result = await historyCommand(tmpVaultPath, password, { limit: 2 });
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
  });
});
