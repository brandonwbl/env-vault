import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerNotifyCommands } from './notify-cmd';
import { loadNotifyStore } from './notify';

function buildProgram(vaultPath: string): Command {
  const program = new Command();
  program.exitOverride();
  registerNotifyCommands(program, vaultPath);
  return program;
}

describe('notify-cmd', () => {
  let vaultPath: string;

  beforeEach(() => {
    vaultPath = path.join(os.tmpdir(), `test-vault-${Date.now()}.vault`);
  });

  it('adds a channel', () => {
    const program = buildProgram(vaultPath);
    program.parse(['notify', 'add', 'ch1', 'slack', '#dev', '--events', 'add,remove'], { from: 'user' });
    const store = loadNotifyStore(vaultPath);
    expect(store.channels).toHaveLength(1);
    expect(store.channels[0].id).toBe('ch1');
    expect(store.channels[0].events).toContain('add');
  });

  it('removes a channel', () => {
    const program = buildProgram(vaultPath);
    program.parse(['notify', 'add', 'ch1', 'email', 'a@b.com'], { from: 'user' });
    program.parse(['notify', 'remove', 'ch1'], { from: 'user' });
    expect(loadNotifyStore(vaultPath).channels).toHaveLength(0);
  });

  it('disables a channel', () => {
    const program = buildProgram(vaultPath);
    program.parse(['notify', 'add', 'ch1', 'webhook', 'https://x.com'], { from: 'user' });
    program.parse(['notify', 'disable', 'ch1'], { from: 'user' });
    expect(loadNotifyStore(vaultPath).channels[0].enabled).toBe(false);
  });

  it('enables a channel', () => {
    const program = buildProgram(vaultPath);
    program.parse(['notify', 'add', 'ch1', 'slack', '#ops'], { from: 'user' });
    program.parse(['notify', 'disable', 'ch1'], { from: 'user' });
    program.parse(['notify', 'enable', 'ch1'], { from: 'user' });
    expect(loadNotifyStore(vaultPath).channels[0].enabled).toBe(true);
  });
});
