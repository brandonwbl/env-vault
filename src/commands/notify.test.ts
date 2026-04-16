import { describe, it, expect, beforeEach } from 'vitest';
import {
  addChannel, removeChannel, toggleChannel,
  formatNotifyList, dispatchNotification, NotifyStore, NotifyChannel
} from './notify';

const makeChannel = (overrides: Partial<NotifyChannel> = {}): NotifyChannel => ({
  id: 'ch1', type: 'slack', target: '#alerts', events: ['add', 'remove'], enabled: true,
  ...overrides
});

const emptyStore: NotifyStore = { channels: [] };

describe('addChannel', () => {
  it('adds a new channel', () => {
    const store = addChannel(emptyStore, makeChannel());
    expect(store.channels).toHaveLength(1);
  });

  it('replaces channel with same id', () => {
    const s1 = addChannel(emptyStore, makeChannel({ target: '#old' }));
    const s2 = addChannel(s1, makeChannel({ target: '#new' }));
    expect(s2.channels).toHaveLength(1);
    expect(s2.channels[0].target).toBe('#new');
  });
});

describe('removeChannel', () => {
  it('removes a channel by id', () => {
    const store = addChannel(emptyStore, makeChannel());
    const result = removeChannel(store, 'ch1');
    expect(result.channels).toHaveLength(0);
  });

  it('is a no-op for unknown id', () => {
    const store = addChannel(emptyStore, makeChannel());
    expect(removeChannel(store, 'nope').channels).toHaveLength(1);
  });
});

describe('toggleChannel', () => {
  it('disables a channel', () => {
    const store = addChannel(emptyStore, makeChannel());
    const result = toggleChannel(store, 'ch1', false);
    expect(result.channels[0].enabled).toBe(false);
  });

  it('enables a channel', () => {
    const store = addChannel(emptyStore, makeChannel({ enabled: false }));
    expect(toggleChannel(store, 'ch1', true).channels[0].enabled).toBe(true);
  });
});

describe('formatNotifyList', () => {
  it('returns message when empty', () => {
    expect(formatNotifyList(emptyStore)).toContain('No notification');
  });

  it('formats channels', () => {
    const store = addChannel(emptyStore, makeChannel());
    const out = formatNotifyList(store);
    expect(out).toContain('ch1');
    expect(out).toContain('slack');
    expect(out).toContain('#alerts');
  });
});

describe('dispatchNotification', () => {
  it('does not dispatch if disabled', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(' '));
    dispatchNotification(makeChannel({ enabled: false }), 'add', 'KEY=val');
    console.log = orig;
    expect(logs).toHaveLength(0);
  });

  it('dispatches on matching event', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(' '));
    dispatchNotification(makeChannel(), 'add', 'KEY=val');
    console.log = orig;
    expect(logs[0]).toContain('event=add');
  });
});
