import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  createVault,
  serializeVault,
  deserializeVault,
  writeVault,
  readVault,
} from './vault';

const PASSWORD = 'vault-test-password';

describe('createVault', () => {
  it('creates an empty vault with correct version', () => {
    const vault = createVault();
    expect(vault.version).toBe(1);
    expect(vault.entries).toEqual({});
  });

  it('creates a vault with initial entries', () => {
    const vault = createVault({ FOO: 'bar' });
    expect(vault.entries.FOO).toBe('bar');
  });
});

describe('serializeVault / deserializeVault', () => {
  it('round-trips vault data', () => {
    const vault = createVault({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    const serialized = serializeVault(vault, PASSWORD);
    const restored = deserializeVault(serialized, PASSWORD);
    expect(restored.entries).toEqual(vault.entries);
  });

  it('throws on wrong password during deserialization', () => {
    const vault = createVault({ SECRET: 'value' });
    const serialized = serializeVault(vault, PASSWORD);
    expect(() => deserializeVault(serialized, 'bad-pass')).toThrow();
  });
});

describe('writeVault / readVault', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-vault-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads vault from disk', () => {
    const filePath = path.join(tmpDir, 'test.vault');
    const vault = createVault({ NODE_ENV: 'production' });
    writeVault(filePath, vault, PASSWORD);
    const restored = readVault(filePath, PASSWORD);
    expect(restored.entries.NODE_ENV).toBe('production');
  });

  it('throws when vault file does not exist', () => {
    expect(() => readVault(path.join(tmpDir, 'missing.vault'), PASSWORD)).toThrow();
  });
});
