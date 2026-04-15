import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  compressVault,
  decompressVault,
  getCompressedPath,
  formatCompressStats,
  CompressStats,
} from './compress';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-test-'));
const vaultPath = path.join(tmpDir, 'test.vault');
const compressedPath = path.join(tmpDir, 'test.vault.gz');
const restoredPath = path.join(tmpDir, 'test.restored.vault');

const sampleContent = JSON.stringify({
  version: 1,
  entries: [
    { key: 'DATABASE_URL', value: 'postgres://localhost:5432/mydb', tags: [] },
    { key: 'API_KEY', value: 'super-secret-key-12345', tags: ['prod'] },
    { key: 'DEBUG', value: 'false', tags: [] },
  ],
});

beforeAll(() => {
  fs.writeFileSync(vaultPath, sampleContent, 'utf8');
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getCompressedPath', () => {
  it('appends .gz to vault path', () => {
    const result = getCompressedPath('/some/dir/my.vault');
    expect(result).toBe('/some/dir/my.vault.gz');
  });

  it('handles paths without extension', () => {
    const result = getCompressedPath('/some/dir/myvault');
    expect(result).toBe('/some/dir/myvault.vault.gz');
  });
});

describe('compressVault', () => {
  it('creates a compressed file', async () => {
    const stats = await compressVault(vaultPath, compressedPath);
    expect(fs.existsSync(compressedPath)).toBe(true);
    expect(stats.originalSize).toBeGreaterThan(0);
    expect(stats.compressedSize).toBeGreaterThan(0);
    expect(stats.compressedSize).toBeLessThanOrEqual(stats.originalSize);
  });

  it('returns a ratio between 0 and 1', async () => {
    const stats = await compressVault(vaultPath, compressedPath);
    expect(stats.ratio).toBeGreaterThan(0);
    expect(stats.ratio).toBeLessThanOrEqual(1);
  });
});

describe('decompressVault', () => {
  it('restores original content', async () => {
    await compressVault(vaultPath, compressedPath);
    await decompressVault(compressedPath, restoredPath);
    const restored = fs.readFileSync(restoredPath, 'utf8');
    expect(restored).toBe(sampleContent);
  });
});

describe('formatCompressStats', () => {
  it('formats stats into readable output', () => {
    const stats: CompressStats = { originalSize: 1000, compressedSize: 600, ratio: 0.6 };
    const output = formatCompressStats(stats);
    expect(output).toContain('1000 bytes');
    expect(output).toContain('600 bytes');
    expect(output).toContain('40.0%');
  });
});
