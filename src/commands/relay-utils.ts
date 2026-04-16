import * as https from 'https';
import * as http from 'http';
import { RelayTarget } from './relay';
import { VaultEntry } from '../crypto/vault';

export interface RelaySendResult {
  targetId: string;
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export function buildRelayPayload(entries: VaultEntry[], source: string): string {
  return JSON.stringify({ source, timestamp: new Date().toISOString(), entries });
}

export async function sendToTarget(target: RelayTarget, payload: string): Promise<RelaySendResult> {
  return new Promise(resolve => {
    const url = new URL(target.url);
    const lib = url.protocol === 'https:' ? https : http;
    const body = payload;
    const req = lib.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Relay-Secret': target.secret, 'Content-Length': Buffer.byteLength(body) } },
      res => resolve({ targetId: target.id, url: target.url, success: (res.statusCode ?? 0) < 400, statusCode: res.statusCode })
    );
    req.on('error', err => resolve({ targetId: target.id, url: target.url, success: false, error: err.message }));
    req.write(body);
    req.end();
  });
}

export function formatRelaySendResults(results: RelaySendResult[]): string {
  return results.map(r =>
    r.success
      ? `✓ ${r.targetId} → ${r.url} (${r.statusCode})`
      : `✗ ${r.targetId} → ${r.url} ${r.error ?? r.statusCode}`
  ).join('\n');
}
