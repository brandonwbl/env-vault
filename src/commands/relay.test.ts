import { describe, it, expect, beforeEach } from 'vitest';
import {
  addRelayTarget, removeRelayTarget, toggleRelayTarget,
  formatRelayList, RelayStore
} from './relay';

function emptyStore(): RelayStore {
  return { targets: [] };
}

describe('addRelayTarget', () => {
  it('adds a target with generated id', () => {
    const store = emptyStore();
    const t = addRelayTarget(store, 'https://example.com/hook', 'secret123');
    expect(store.targets).toHaveLength(1);
    expect(t.url).toBe('https://example.com/hook');
    expect(t.enabled).toBe(true);
    expect(t.id).toBeTruthy();
  });
});

describe('removeRelayTarget', () => {
  it('removes existing target', () => {
    const store = emptyStore();
    const t = addRelayTarget(store, 'https://a.com', 's');
    expect(removeRelayTarget(store, t.id)).toBe(true);
    expect(store.targets).toHaveLength(0);
  });

  it('returns false for missing id', () => {
    const store = emptyStore();
    expect(removeRelayTarget(store, 'nonexistent')).toBe(false);
  });
});

describe('toggleRelayTarget', () => {
  it('disables a target', () => {
    const store = emptyStore();
    const t = addRelayTarget(store, 'https://a.com', 's');
    expect(toggleRelayTarget(store, t.id, false)).toBe(true);
    expect(store.targets[0].enabled).toBe(false);
  });

  it('returns false for unknown id', () => {
    const store = emptyStore();
    expect(toggleRelayTarget(store, 'x', true)).toBe(false);
  });
});

describe('formatRelayList', () => {
  it('returns message when empty', () => {
    expect(formatRelayList(emptyStore())).toMatch(/No relay/);
  });

  it('lists targets with status', () => {
    const store = emptyStore();
    addRelayTarget(store, 'https://a.com', 's');
    toggleRelayTarget(store, store.targets[0].id, false);
    const out = formatRelayList(store);
    expect(out).toContain('OFF');
    expect(out).toContain('https://a.com');
  });
});
