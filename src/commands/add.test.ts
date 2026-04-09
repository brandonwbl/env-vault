import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addSecret, addSecretsFromEnvString } from './add';
import { readVault } from '../crypto';

const PASSWORD = 'test-password-123';

function tmpVaultPath(): string {
  return path.join(os.tmpdir(), `vault-add-test-${Date.now()}.vault`);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('addSecret', () => {
  it('creates vault and adds a secret when vault does not exist', async () => {
    const vaultPath = tmpVaultPath();
    await addSecret({ vaultPath, password: PASSWORD, key: 'DB_HOST', value: 'localhost' });

    const vault = await readVault(vaultPath, PASSWORD);
    expect(vault.secrets['DB_HOST']).toBe('localhost');

    fs.unlinkSync(vaultPath);
  });

  it('updates an existing secret', async () => {
    const vaultPath = tmpVaultPath();
    await addSecret({ vaultPath, password: PASSWORD, key: 'API_KEY', value: 'old-value' });
    await addSecret({ vaultPath, password: PASSWORD, key: 'API_KEY', value: 'new-value' });

    const vault = await readVault(vaultPath, PASSWORD);
    expect(vault.secrets['API_KEY']).toBe('new-value');

    fs.unlinkSync(vaultPath);
  });

  it('throws on empty key', async () => {
    const vaultPath = tmpVaultPath();
    await expect(
      addSecret({ vaultPath, password: PASSWORD, key: '', value: 'value' })
    ).rejects.toThrow('Key must not be empty');
  });

  it('throws on invalid key format', async () => {
    const vaultPath = tmpVaultPath();
    await expect(
      addSecret({ vaultPath, password: PASSWORD, key: '1INVALID', value: 'value' })
    ).rejects.toThrow('Invalid key format');
  });
});

describe('addSecretsFromEnvString', () => {
  it('imports multiple secrets from env string', async () => {
    const vaultPath = tmpVaultPath();
    const envString = 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret';

    await addSecretsFromEnvString(envString, vaultPath, PASSWORD);

    const vault = await readVault(vaultPath, PASSWORD);
    expect(vault.secrets['DB_HOST']).toBe('localhost');
    expect(vault.secrets['DB_PORT']).toBe('5432');
    expect(vault.secrets['API_KEY']).toBe('secret');

    fs.unlinkSync(vaultPath);
  });

  it('logs message when no secrets found', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const vaultPath = tmpVaultPath();

    await addSecretsFromEnvString('', vaultPath, PASSWORD);

    expect(consoleSpy).toHaveBeenCalledWith('No secrets found in input.');
  });
});
