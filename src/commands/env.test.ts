import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, writeVault } from '../crypto';
import { envCommand, envSetCommand, envUnsetCommand } from './env';

const tmpVaultPath = path.join(os.tmpdir(), `env-vault-env-test-${Date.now()}.vault`);
const password = 'test-password-env';

beforeEach(async () => {
  const vault = createVault();
  vault.data = { API_KEY: 'abc123', DB_HOST: 'localhost', SECRET: 'shh' };
  await writeVault(tmpVaultPath, password, vault);
});

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

describe('envCommand', () => {
  it('returns export format by default', async () => {
    const result = await envCommand({ vaultPath: tmpVaultPath, password });
    expect(result).toContain('export API_KEY=abc123');
    expect(result).toContain('export DB_HOST=localhost');
  });

  it('returns raw format', async () => {
    const result = await envCommand({ vaultPath: tmpVaultPath, password, format: 'raw' });
    expect(result).toContain('API_KEY=abc123');
    expect(result).not.toContain('export API_KEY');
  });

  it('returns json format', async () => {
    const result = await envCommand({ vaultPath: tmpVaultPath, password, format: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed.API_KEY).toBe('abc123');
    expect(parsed.DB_HOST).toBe('localhost');
  });

  it('filters keys by pattern', async () => {
    const result = await envCommand({ vaultPath: tmpVaultPath, password, filter: 'DB_' });
    expect(result).toContain('DB_HOST');
    expect(result).not.toContain('API_KEY');
  });

  it('returns empty string when filter matches nothing', async () => {
    const result = await envCommand({ vaultPath: tmpVaultPath, password, filter: 'NONEXISTENT' });
    expect(result).toBe('');
  });
});

describe('envSetCommand', () => {
  it('sets a new key in the vault', async () => {
    await envSetCommand('NEW_VAR', 'new_value', { vaultPath: tmpVaultPath, password });
    const result = await envCommand({ vaultPath: tmpVaultPath, password, format: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed.NEW_VAR).toBe('new_value');
  });

  it('overwrites an existing key', async () => {
    await envSetCommand('API_KEY', 'updated', { vaultPath: tmpVaultPath, password });
    const result = await envCommand({ vaultPath: tmpVaultPath, password, format: 'json' });
    expect(JSON.parse(result).API_KEY).toBe('updated');
  });
});

describe('envUnsetCommand', () => {
  it('removes an existing key', async () => {
    await envUnsetCommand('API_KEY', { vaultPath: tmpVaultPath, password });
    const result = await envCommand({ vaultPath: tmpVaultPath, password, format: 'json' });
    expect(JSON.parse(result).API_KEY).toBeUndefined();
  });

  it('throws when key does not exist', async () => {
    await expect(
      envUnsetCommand('MISSING_KEY', { vaultPath: tmpVaultPath, password })
    ).rejects.toThrow('Key "MISSING_KEY" not found in vault');
  });
});
