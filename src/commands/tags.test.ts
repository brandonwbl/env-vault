import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, writeVault } from '../crypto';
import { formatAllTags, tagsCommand } from './tags';

const tmpVaultPath = path.join(os.tmpdir(), `tags-test-${Date.now()}.vault`);
const password = 'test-password-tags';

async function setupVault() {
  const vault = createVault();
  vault.entries['API_KEY'] = { value: 'abc', tags: ['prod', 'auth'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  vault.entries['DB_URL'] = { value: 'pg://localhost', tags: ['prod', 'db'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  vault.entries['SECRET'] = { value: 'shhh', tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await writeVault(tmpVaultPath, password, vault);
}

beforeEach(async () => {
  await setupVault();
});

afterAll(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

describe('formatAllTags', () => {
  it('returns message when no tags', () => {
    expect(formatAllTags({})).toBe('No tags found in vault.');
  });

  it('formats tag map correctly', () => {
    const result = formatAllTags({ prod: ['API_KEY', 'DB_URL'], auth: ['API_KEY'] });
    expect(result).toContain('[auth]');
    expect(result).toContain('[prod]');
    expect(result).toContain('2 entries');
    expect(result).toContain('1 entry');
    expect(result).toContain('API_KEY');
  });

  it('sorts tags alphabetically', () => {
    const result = formatAllTags({ z: ['KEY1'], a: ['KEY2'] });
    expect(result.indexOf('[a]')).toBeLessThan(result.indexOf('[z]'));
  });
});

describe('tagsCommand', () => {
  it('lists all unique tag names in non-verbose mode', async () => {
    const logs: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    await tagsCommand({ vaultPath: tmpVaultPath, password });
    expect(logs).toContain('prod');
    expect(logs).toContain('auth');
    expect(logs).toContain('db');
    spy.mockRestore();
  });

  it('shows verbose output with entry counts', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await tagsCommand({ vaultPath: tmpVaultPath, password, verbose: true });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[prod]'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2 entries'));
    spy.mockRestore();
  });

  it('reports no tags when vault entries have none', async () => {
    const emptyVault = createVault();
    const emptyPath = path.join(os.tmpdir(), `tags-empty-${Date.now()}.vault`);
    emptyVault.entries['KEY'] = { value: 'val', tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await writeVault(emptyPath, password, emptyVault);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await tagsCommand({ vaultPath: emptyPath, password });
    expect(spy).toHaveBeenCalledWith('No tags found in vault.');
    spy.mockRestore();
    fs.unlinkSync(emptyPath);
  });
});
