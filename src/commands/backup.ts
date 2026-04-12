import * as fs from "fs";
import * as path from "path";
import { readVault, writeVault } from "../crypto";

export interface BackupOptions {
  vaultPath: string;
  backupDir?: string;
  password: string;
}

export function getBackupPath(vaultPath: string, backupDir?: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const vaultName = path.basename(vaultPath, path.extname(vaultPath));
  const dir = backupDir ?? path.dirname(vaultPath);
  return path.join(dir, `${vaultName}.backup.${timestamp}.vault`);
}

export async function backupVault(options: BackupOptions): Promise<string> {
  const { vaultPath, backupDir, password } = options;

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  if (backupDir && !fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const vault = await readVault(vaultPath, password);
  const backupPath = getBackupPath(vaultPath, backupDir);
  await writeVault(backupPath, vault, password);

  return backupPath;
}

export function listBackups(vaultPath: string, backupDir?: string): string[] {
  const vaultName = path.basename(vaultPath, path.extname(vaultPath));
  const dir = backupDir ?? path.dirname(vaultPath);

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${vaultName}.backup.`) && f.endsWith(".vault"))
    .map((f) => path.join(dir, f))
    .sort();
}

export function formatBackupList(backups: string[]): string {
  if (backups.length === 0) return "No backups found.";
  return backups.map((b, i) => `  [${i + 1}] ${path.basename(b)}`).join("\n");
}
