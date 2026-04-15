import * as fs from 'fs';
import * as zlib from 'zlib';
import * as path from 'path';
import { readVault, writeVault } from '../crypto/vault';
import { VaultEntry } from '../crypto/vault';

export interface CompressStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export function getCompressedPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.vault.gz`);
}

export async function compressVault(
  vaultPath: string,
  outputPath?: string
): Promise<CompressStats> {
  const raw = fs.readFileSync(vaultPath);
  const originalSize = raw.length;

  const compressed = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
  const compressedSize = compressed.length;

  const dest = outputPath ?? getCompressedPath(vaultPath);
  fs.writeFileSync(dest, compressed);

  return {
    originalSize,
    compressedSize,
    ratio: compressedSize / originalSize,
  };
}

export async function decompressVault(
  compressedPath: string,
  outputPath: string
): Promise<void> {
  const raw = fs.readFileSync(compressedPath);
  const decompressed = zlib.gunzipSync(raw);
  fs.writeFileSync(outputPath, decompressed);
}

export function formatCompressStats(stats: CompressStats): string {
  const pct = ((1 - stats.ratio) * 100).toFixed(1);
  return [
    `Original size : ${stats.originalSize} bytes`,
    `Compressed size: ${stats.compressedSize} bytes`,
    `Reduction      : ${pct}%`,
  ].join('\n');
}
