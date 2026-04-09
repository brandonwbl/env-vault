import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, serializeVault, writeVault } from '../crypto';
import { getCommand, listCommand } from './get';

const tmpVaultPath = path.join(os.tmpdir(), `env-vault-get-test-${Date.now()}.vault`);
const TEST_PASSWORD = 'test-password-get';
const INITIAL_CONTENT = 'API_KEY=abc123\nDB_URL=postgres://localhost/test\nDEBUG=true';

async function setupVault() {
  const vault = await createVault(INITIAL_CONTENT, TEST_PASSWORD);
  const serialized = await serializeVault(vault);
  await writeVault(tmpVaultPath, serialized);
}

beforeAll(async () => {
  await setupVault();
});

afterAll(() => {
  if (fs.existsSync(tmpVaultPath)) {
    fs.unlinkSync(tmpVaultPath);
  }
});

describe('getCommand', () => {
  it('returns the value of an existing key', async () => {
    const value = await getCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'API_KEY' });
    expect(value).toBe('abc123');
  });

  it('returns undefined for a missing key', async () => {
    const value = await getCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'MISSING_KEY' });
    expect(value).toBeUndefined();
  });

  it('outputs JSON when json flag is set', async () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await getCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, key: 'DB_URL', json: true });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"key":"DB_URL"'));
    spy.mockRestore();
  });
});

describe('listCommand', () => {
  it('returns all keys from the vault', async () => {
    const keys = await listCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD });
    expect(keys).toContain('API_KEY');
    expect(keys).toContain('DB_URL');
    expect(keys).toContain('DEBUG');
    expect(keys).toHaveLength(3);
  });

  it('outputs JSON array when json flag is set', async () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await listCommand({ vaultPath: tmpVaultPath, password: TEST_PASSWORD, json: true });
    const call = (spy.mock.calls[0][0] as string);
    const parsed = JSON.parse(call);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('key');
    expect(parsed[0]).toHaveProperty('value');
    spy.mockRestore();
  });
});
