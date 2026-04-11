import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, writeVault, readVault } from '../crypto';
import { tagCommand, listByTagCommand } from './tag';

const tmpVaultPath = path.join(os.tmpdir(), `tag-test-${Date.now()}.vault`);
const password = 'test-password-tag';

async function setupVault() {
  const vault = createVault();
  vault.entries['API_KEY'] = { value: 'abc123', tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  vault.entries['DB_URL'] = { value: 'postgres://localhost', tags: ['db'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await writeVault(tmpVaultPath, password, vault);
}

afterAll(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

beforeEach(async () => {
  await setupVault();
});

describe('tagCommand', () => {
  it('adds tags to an existing key', async () => {
    await tagCommand({ vaultPath: tmpVaultPath, password, key: 'API_KEY', tags: ['prod', 'auth'] });
    const vault = await readVault(tmpVaultPath, password);
    expect(vault.entries['API_KEY'].tags).toContain('prod');
    expect(vault.entries['API_KEY'].tags).toContain('auth');
  });

  it('does not duplicate existing tags', async () => {
    await tagCommand({ vaultPath: tmpVaultPath, password, key: 'DB_URL', tags: ['db', 'new-tag'] });
    const vault = await readVault(tmpVaultPath, password);
    const dbTags = vault.entries['DB_URL'].tags;
    expect(dbTags.filter((t: string) => t === 'db').length).toBe(1);
    expect(dbTags).toContain('new-tag');
  });

  it('removes tags when remove=true', async () => {
    await tagCommand({ vaultPath: tmpVaultPath, password, key: 'DB_URL', tags: ['db'], remove: true });
    const vault = await readVault(tmpVaultPath, password);
    expect(vault.entries['DB_URL'].tags).not.toContain('db');
  });

  it('throws if key does not exist', async () => {
    await expect(
      tagCommand({ vaultPath: tmpVaultPath, password, key: 'NONEXISTENT', tags: ['x'] })
    ).rejects.toThrow('Key "NONEXISTENT" not found in vault');
  });
});

describe('listByTagCommand', () => {
  it('lists entries matching a tag', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await listByTagCommand({ vaultPath: tmpVaultPath, password, tag: 'db' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('DB_URL'));
    spy.mockRestore();
  });

  it('reports no entries when tag not found', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await listByTagCommand({ vaultPath: tmpVaultPath, password, tag: 'nonexistent' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No entries found'));
    spy.mockRestore();
  });
});
