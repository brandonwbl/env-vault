import * as fs from 'fs';
import * as path from 'path';

export interface LockFile {
  lockedAt: string;
  lockedBy: string;
  vaultPath: string;
}

export function getLockPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.lock`);
}

export function isLocked(vaultPath: string): boolean {
  return fs.existsSync(getLockPath(vaultPath));
}

export function readLock(vaultPath: string): LockFile | null {
  const lockPath = getLockPath(vaultPath);
  if (!fs.existsSync(lockPath)) return null;
  const raw = fs.readFileSync(lockPath, 'utf-8');
  return JSON.parse(raw) as LockFile;
}

export function acquireLock(vaultPath: string, user: string): void {
  if (isLocked(vaultPath)) {
    const existing = readLock(vaultPath)!;
    throw new Error(
      `Vault is already locked by "${existing.lockedBy}" since ${existing.lockedAt}`
    );
  }
  const lock: LockFile = {
    lockedAt: new Date().toISOString(),
    lockedBy: user,
    vaultPath: path.resolve(vaultPath),
  };
  fs.writeFileSync(getLockPath(vaultPath), JSON.stringify(lock, null, 2), 'utf-8');
}

export function releaseLock(vaultPath: string, user: string): void {
  const lock = readLock(vaultPath);
  if (!lock) {
    throw new Error('Vault is not locked.');
  }
  if (lock.lockedBy !== user) {
    throw new Error(
      `Cannot release lock owned by "${lock.lockedBy}". Only the lock owner can release it.`
    );
  }
  fs.unlinkSync(getLockPath(vaultPath));
}

export function formatLockStatus(lock: LockFile | null): string {
  if (!lock) return 'Vault is unlocked.';
  return `Locked by: ${lock.lockedBy}\nLocked at: ${lock.lockedAt}\nVault:     ${lock.vaultPath}`;
}
