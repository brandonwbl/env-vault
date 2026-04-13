import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { startWatch } from './watch';
import { createVault, writeVault, readVault } from '../crypto/vault';

const PASSWORD = 'watchpass';

async function makeTmpVault(): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-vault-watch-'));
  const vaultPath = path.join(dir, 'test.vault');
  const vault = createVault();
  await writeVault(vaultPath, PASSWORD, vault);
  return vaultPath;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('startWatch', () => {
  it('detects added keys from .env file', async () => {
    const vaultPath = await makeTmpVault();
    const dir = path.dirname(vaultPath);
    const envFile = path.join(dir, '.env');

    fs.writeFileSync(envFile, 'NEW_KEY=hello\n');

    const added: string[] = [];
    const stop = startWatch(
      { vaultPath, envFile, password: PASSWORD, interval: 50 },
      (a) => added.push(...a),
      (err) => { throw err; }
    );

    await sleep(200);
    stop();

    expect(added).toContain('NEW_KEY');
    const vault = await readVault(vaultPath, PASSWORD);
    expect(vault.entries.find((e) => e.key === 'NEW_KEY')?.value).toBe('hello');
  });

  it('detects updated keys', async () => {
    const vaultPath = await makeTmpVault();
    const vault = await readVault(vaultPath, PASSWORD);
    vault.entries.push({ key: 'EXISTING', value: 'old', tags: [] });
    await writeVault(vaultPath, PASSWORD, vault);

    const dir = path.dirname(vaultPath);
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'EXISTING=new\n');

    const updated: string[] = [];
    const stop = startWatch(
      { vaultPath, envFile, password: PASSWORD, interval: 50 },
      (_, __, u) => updated.push(...u),
      (err) => { throw err; }
    );

    await sleep(200);
    stop();

    expect(updated).toContain('EXISTING');
    const v2 = await readVault(vaultPath, PASSWORD);
    expect(v2.entries.find((e) => e.key === 'EXISTING')?.value).toBe('new');
  });

  it('detects removed keys', async () => {
    const vaultPath = await makeTmpVault();
    const vault = await readVault(vaultPath, PASSWORD);
    vault.entries.push({ key: 'OLD_KEY', value: 'val', tags: [] });
    await writeVault(vaultPath, PASSWORD, vault);

    const dir = path.dirname(vaultPath);
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'OTHER=x\n');

    const removed: string[] = [];
    const stop = startWatch(
      { vaultPath, envFile, password: PASSWORD, interval: 50 },
      (_, r) => removed.push(...r),
      (err) => { throw err; }
    );

    await sleep(200);
    stop();

    expect(removed).toContain('OLD_KEY');
  });

  it('does not sync if file has not changed', async () => {
    const vaultPath = await makeTmpVault();
    const dir = path.dirname(vaultPath);
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'STABLE=1\n');

    let syncCount = 0;
    const stop = startWatch(
      { vaultPath, envFile, password: PASSWORD, interval: 50 },
      () => syncCount++,
      (err) => { throw err; }
    );

    await sleep(250);
    stop();
    expect(syncCount).toBe(1);
  });
});
