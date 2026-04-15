import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  addWebhook,
  removeWebhook,
  loadWebhooks,
  signPayload,
  formatWebhookList,
  getWebhookPath,
} from './webhook';

let tmpVaultPath: string;

beforeEach(() => {
  tmpVaultPath = path.join(os.tmpdir(), `vault-${Date.now()}.enc`);
});

afterEach(() => {
  const p = getWebhookPath(tmpVaultPath);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('loadWebhooks', () => {
  it('returns empty array when no file exists', () => {
    expect(loadWebhooks(tmpVaultPath)).toEqual([]);
  });
});

describe('addWebhook', () => {
  it('adds a webhook with generated id and secret', () => {
    const hook = addWebhook(tmpVaultPath, 'https://example.com/hook', ['add', 'remove']);
    expect(hook.url).toBe('https://example.com/hook');
    expect(hook.events).toEqual(['add', 'remove']);
    expect(hook.id).toHaveLength(36);
    expect(hook.secret).toHaveLength(48);
  });

  it('persists multiple webhooks', () => {
    addWebhook(tmpVaultPath, 'https://a.com', ['add']);
    addWebhook(tmpVaultPath, 'https://b.com', ['remove']);
    expect(loadWebhooks(tmpVaultPath)).toHaveLength(2);
  });
});

describe('removeWebhook', () => {
  it('removes an existing webhook and returns true', () => {
    const hook = addWebhook(tmpVaultPath, 'https://example.com', ['add']);
    const result = removeWebhook(tmpVaultPath, hook.id);
    expect(result).toBe(true);
    expect(loadWebhooks(tmpVaultPath)).toHaveLength(0);
  });

  it('returns false when webhook not found', () => {
    const result = removeWebhook(tmpVaultPath, 'nonexistent-id');
    expect(result).toBe(false);
  });
});

describe('signPayload', () => {
  it('produces consistent HMAC signature', () => {
    const sig1 = signPayload('hello', 'secret');
    const sig2 = signPayload('hello', 'secret');
    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64);
  });

  it('produces different signatures for different secrets', () => {
    expect(signPayload('hello', 'secret1')).not.toBe(signPayload('hello', 'secret2'));
  });
});

describe('formatWebhookList', () => {
  it('returns message when no webhooks', () => {
    expect(formatWebhookList([])).toBe('No webhooks registered.');
  });

  it('formats webhook entries', () => {
    const hook = addWebhook(tmpVaultPath, 'https://example.com', ['add']);
    const hooks = loadWebhooks(tmpVaultPath);
    const output = formatWebhookList(hooks);
    expect(output).toContain('https://example.com');
    expect(output).toContain(hook.id.slice(0, 8));
    expect(output).toContain('add');
  });
});
