import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  createdAt: string;
}

export interface WebhookPayload {
  event: string;
  vaultPath: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function getWebhookPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.webhooks.json');
}

export function loadWebhooks(vaultPath: string): WebhookConfig[] {
  const p = getWebhookPath(vaultPath);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveWebhooks(vaultPath: string, webhooks: WebhookConfig[]): void {
  fs.writeFileSync(getWebhookPath(vaultPath), JSON.stringify(webhooks, null, 2));
}

export function addWebhook(
  vaultPath: string,
  url: string,
  events: string[]
): WebhookConfig {
  const webhooks = loadWebhooks(vaultPath);
  const hook: WebhookConfig = {
    id: crypto.randomUUID(),
    url,
    secret: crypto.randomBytes(24).toString('hex'),
    events,
    createdAt: new Date().toISOString(),
  };
  webhooks.push(hook);
  saveWebhooks(vaultPath, webhooks);
  return hook;
}

export function removeWebhook(vaultPath: string, id: string): boolean {
  const webhooks = loadWebhooks(vaultPath);
  const next = webhooks.filter((w) => w.id !== id);
  if (next.length === webhooks.length) return false;
  saveWebhooks(vaultPath, next);
  return true;
}

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function formatWebhookList(webhooks: WebhookConfig[]): string {
  if (webhooks.length === 0) return 'No webhooks registered.';
  return webhooks
    .map(
      (w) =>
        `[${w.id.slice(0, 8)}] ${w.url}\n  events: ${w.events.join(', ')}\n  created: ${w.createdAt}`
    )
    .join('\n');
}
