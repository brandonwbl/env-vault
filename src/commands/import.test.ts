import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { importEnvFile } from './import';
import { createVault, writeVault, readVault } from '../crypto';

const TEST_PASSWORD = 'test-password-123';

const tmpVaultPath = path.join(os.tmpdir(), `test-vault-import-${Date.now()}.vault`);
const tmpEnvPath = path.join(os.tmpdir(), `test-import-${Date.now()}.env`);

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
  if (fs.existsSync(tmpEnvPath)) fs.unlinkSync(tmpEnvPath);
});

async function setupVault(initial: Record<string, string> = {}) {
  const vault = createVault();
  vault.entries = initial;
  await writeVault(tmpVaultPath, vault, TEST_PASSWORD);
}

describe('importEnvFile', () => {
  it('imports variables from a .env file into the vault', async () => {
    await setupVault();
    fs.writeFileSync(tmpEnvPath, 'API_KEY=abc123\nDB_URL=postgres://localhost/db\n');

    const result = await importEnvFile({
      vaultPath: tmpVaultPath,
      envFilePath: tmpEnvPath,
      password: TEST_PASSWORD,
    });

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.keys).toContain('API_KEY');
    expect(result.keys).toContain('DB_URL');

    const vault = await readVault(tmpVaultPath, TEST_PASSWORD);
    expect(vault.entries['API_KEY']).toBe('abc123');
    expect(vault.entries['DB_URL']).toBe('postgres://localhost/db');
  });

  it('skips existing keys when overwrite is false', async () => {
    await setupVault({ API_KEY: 'original' });
    fs.writeFileSync(tmpEnvPath, 'API_KEY=new_value\nNEW_VAR=hello\n');

    const result = await importEnvFile({
      vaultPath: tmpVaultPath,
      envFilePath: tmpEnvPath,
      password: TEST_PASSWORD,
      overwrite: false,
    });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);

    const vault = await readVault(tmpVaultPath, TEST_PASSWORD);
    expect(vault.entries['API_KEY']).toBe('original');
    expect(vault.entries['NEW_VAR']).toBe('hello');
  });

  it('overwrites existing keys when overwrite is true', async () => {
    await setupVault({ API_KEY: 'original' });
    fs.writeFileSync(tmpEnvPath, 'API_KEY=updated\n');

    const result = await importEnvFile({
      vaultPath: tmpVaultPath,
      envFilePath: tmpEnvPath,
      password: TEST_PASSWORD,
      overwrite: true,
    });

    expect(result.imported).toBe(1);
    const vault = await readVault(tmpVaultPath, TEST_PASSWORD);
    expect(vault.entries['API_KEY']).toBe('updated');
  });

  it('throws if env file does not exist', async () => {
    await setupVault();
    await expect(
      importEnvFile({ vaultPath: tmpVaultPath, envFilePath: '/nonexistent/.env', password: TEST_PASSWORD })
    ).rejects.toThrow('Env file not found');
  });

  it('throws if env file has no valid variables', async () => {
    await setupVault();
    fs.writeFileSync(tmpEnvPath, '# only a comment\n\n');
    await expect(
      importEnvFile({ vaultPath: tmpVaultPath, envFilePath: tmpEnvPath, password: TEST_PASSWORD })
    ).rejects.toThrow('No valid environment variables found');
  });
});
