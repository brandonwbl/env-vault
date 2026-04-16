import { describe, it, expect } from 'vitest';
import { buildRelayPayload, formatRelaySendResults, RelaySendResult } from './relay-utils';
import { VaultEntry } from '../crypto/vault';

const entries: VaultEntry[] = [
  { key: 'FOO', value: 'bar', tags: [] },
];

describe('buildRelayPayload', () => {
  it('includes entries and source', () => {
    const payload = JSON.parse(buildRelayPayload(entries, '/tmp/vault'));
    expect(payload.source).toBe('/tmp/vault');
    expect(payload.entries).toHaveLength(1);
    expect(payload.timestamp).toBeTruthy();
  });
});

describe('formatRelaySendResults', () => {
  it('formats success', () => {
    const results: RelaySendResult[] = [{ targetId: 'abc', url: 'https://x.com', success: true, statusCode: 200 }];
    expect(formatRelaySendResults(results)).toContain('✓');
    expect(formatRelaySendResults(results)).toContain('abc');
  });

  it('formats failure with error', () => {
    const results: RelaySendResult[] = [{ targetId: 'xyz', url: 'https://y.com', success: false, error: 'ECONNREFUSED' }];
    const out = formatRelaySendResults(results);
    expect(out).toContain('✗');
    expect(out).toContain('ECONNREFUSED');
  });

  it('formats failure with status code', () => {
    const results: RelaySendResult[] = [{ targetId: 'xyz', url: 'https://y.com', success: false, statusCode: 500 }];
    expect(formatRelaySendResults(results)).toContain('500');
  });
});
