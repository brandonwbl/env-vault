import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { buildPinProgram } from './pin-cmd';
import { createVault, writeVault } from '../crypto';

const PASSWORD = 'test-password';

let tmpDir: string;
let vaultPath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-cmd-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  const vault = createVault({ API_KEY: 'abc123', DB_PASS: 'secret' });
  await writeVault(vaultPath, PASSWORD, vault);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function run(args: string[]): Promise<string> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  vi.spyOn(console, 'error').mockImplementation((...a) => logs.push(a.join(' ')));
  const program = buildPinProgram(vaultPath, PASSWORD);
  await program.parseAsync(['node', 'env-vault', ...args]);
  spy.mockRestore();
  return logs.join('\n');
}

describe('pin add', () => {
  it('pins an existing key', async () => {
    const out = await run(['pin', 'add', 'API_KEY']);
    expect(out).toContain('Pinned "API_KEY"');
  });

  it('reports already pinned', async () => {
    await run(['pin', 'add', 'API_KEY']);
    const out = await run(['pin', 'add', 'API_KEY']);
    expect(out).toContain('already pinned');
  });

  it('reports missing key', async () => {
    const out = await run(['pin', 'add', 'MISSING']);
    expect(out).toContain('not found');
  });
});

describe('pin remove', () => {
  it('unpins a pinned key', async () => {
    await run(['pin', 'add', 'DB_PASS']);
    const out = await run(['pin', 'remove', 'DB_PASS']);
    expect(out).toContain('Unpinned "DB_PASS"');
  });

  it('reports key was not pinned', async () => {
    const out = await run(['pin', 'remove', 'API_KEY']);
    expect(out).toContain('was not pinned');
  });
});

describe('pin list', () => {
  it('shows no pinned entries initially', async () => {
    const out = await run(['pin', 'list']);
    expect(out).toContain('No pinned entries.');
  });

  it('lists pinned entries after adding', async () => {
    await run(['pin', 'add', 'API_KEY', '--note', 'important']);
    const out = await run(['pin', 'list']);
    expect(out).toContain('API_KEY');
    expect(out).toContain('important');
  });
});
