import {
  addRule,
  removeRule,
  checkRateLimit,
  recordRequest,
  formatRateLimitList,
  RateLimitStore,
} from './rate-limit';

const emptyStore: RateLimitStore = { rules: [], entries: [] };

describe('addRule', () => {
  it('adds a new rule', () => {
    const store = addRule(emptyStore, { key: 'get', maxRequests: 10, windowSeconds: 60 });
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].key).toBe('get');
  });

  it('updates an existing rule', () => {
    let store = addRule(emptyStore, { key: 'get', maxRequests: 10, windowSeconds: 60 });
    store = addRule(store, { key: 'get', maxRequests: 20, windowSeconds: 30 });
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].maxRequests).toBe(20);
  });
});

describe('removeRule', () => {
  it('removes an existing rule', () => {
    let store = addRule(emptyStore, { key: 'get', maxRequests: 10, windowSeconds: 60 });
    store = removeRule(store, 'get');
    expect(store.rules).toHaveLength(0);
  });

  it('is a no-op for unknown key', () => {
    const store = removeRule(emptyStore, 'missing');
    expect(store.rules).toHaveLength(0);
  });
});

describe('checkRateLimit', () => {
  it('allows when no rule exists', () => {
    const result = checkRateLimit(emptyStore, 'any');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('allows first request within limit', () => {
    const store = addRule(emptyStore, { key: 'get', maxRequests: 5, windowSeconds: 60 });
    const result = checkRateLimit(store, 'get', 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when limit exceeded', () => {
    let store = addRule(emptyStore, { key: 'get', maxRequests: 2, windowSeconds: 60 });
    const now = 1000;
    store = recordRequest(store, 'get', now);
    store = recordRequest(store, 'get', now + 100);
    const result = checkRateLimit(store, 'get', now + 200);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    let store = addRule(emptyStore, { key: 'get', maxRequests: 1, windowSeconds: 1 });
    store = recordRequest(store, 'get', 0);
    store = recordRequest(store, 'get', 100);
    const result = checkRateLimit(store, 'get', 2000);
    expect(result.allowed).toBe(true);
  });
});

describe('recordRequest', () => {
  it('increments count within window', () => {
    let store = addRule(emptyStore, { key: 'add', maxRequests: 10, windowSeconds: 60 });
    store = recordRequest(store, 'add', 1000);
    store = recordRequest(store, 'add', 2000);
    expect(store.entries[0].count).toBe(2);
  });

  it('resets count after window', () => {
    let store = addRule(emptyStore, { key: 'add', maxRequests: 10, windowSeconds: 1 });
    store = recordRequest(store, 'add', 0);
    store = recordRequest(store, 'add', 2000);
    expect(store.entries[0].count).toBe(1);
  });
});

describe('formatRateLimitList', () => {
  it('returns message when no rules', () => {
    expect(formatRateLimitList(emptyStore)).toMatch(/No rate limit/);
  });

  it('formats rules correctly', () => {
    const store = addRule(emptyStore, { key: 'get', maxRequests: 10, windowSeconds: 60 });
    const output = formatRateLimitList(store);
    expect(output).toContain('get');
    expect(output).toContain('10 req / 60s');
  });
});
