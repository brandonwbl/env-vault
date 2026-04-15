import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getLockPath,
  isLocked,
  acquireLock,
  releaseLock,
  readLock,
  formatLockStatus,
} from './lock';

const tmpVaultPath = path.join(os.tmpdir(), `test-vault-${Date.now()}.vault`);

afterEach(() => {
  const lockPath = getLockPath(tmpVaultPath);
  if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
});

describe('getLockPath', () => {
  it('returns path with .lock extension', () => {
    expect(getLockPath('/some/dir/my.vault')).toBe('/some/dir/my.lock');
  });
});

describe('isLocked', () => {
  it('returns false when no lock file exists', () => {
    expect(isLocked(tmpVaultPath)).toBe(false);
  });

  it('returns true after acquiring a lock', () => {
    acquireLock(tmpVaultPath, 'alice');
    expect(isLocked(tmpVaultPath)).toBe(true);
  });
});

describe('acquireLock', () => {
  it('creates a lock file with correct metadata', () => {
    acquireLock(tmpVaultPath, 'alice');
    const lock = readLock(tmpVaultPath);
    expect(lock).not.toBeNull();
    expect(lock!.lockedBy).toBe('alice');
    expect(lock!.vaultPath).toBe(path.resolve(tmpVaultPath));
  });

  it('throws if vault is already locked', () => {
    acquireLock(tmpVaultPath, 'alice');
    expect(() => acquireLock(tmpVaultPath, 'bob')).toThrow(
      /already locked by "alice"/
    );
  });
});

describe('releaseLock', () => {
  it('removes the lock file when released by owner', () => {
    acquireLock(tmpVaultPath, 'alice');
    releaseLock(tmpVaultPath, 'alice');
    expect(isLocked(tmpVaultPath)).toBe(false);
  });

  it('throws when releasing a non-existent lock', () => {
    expect(() => releaseLock(tmpVaultPath, 'alice')).toThrow('not locked');
  });

  it('throws when non-owner tries to release', () => {
    acquireLock(tmpVaultPath, 'alice');
    expect(() => releaseLock(tmpVaultPath, 'bob')).toThrow(
      /owned by "alice"/
    );
  });
});

describe('formatLockStatus', () => {
  it('returns unlocked message when null', () => {
    expect(formatLockStatus(null)).toBe('Vault is unlocked.');
  });

  it('returns lock details when locked', () => {
    acquireLock(tmpVaultPath, 'alice');
    const lock = readLock(tmpVaultPath);
    const output = formatLockStatus(lock);
    expect(output).toContain('alice');
    expect(output).toContain('Locked by');
  });
});
