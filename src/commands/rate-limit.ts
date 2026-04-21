import * as fs from 'fs';
import * as path from 'path';

export interface RateLimitRule {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
}

export interface RateLimitStore {
  rules: RateLimitRule[];
  entries: RateLimitEntry[];
}

export function getRateLimitPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.rate-limit.json');
}

export function loadRateLimitStore(storePath: string): RateLimitStore {
  if (!fs.existsSync(storePath)) {
    return { rules: [], entries: [] };
  }
  return JSON.parse(fs.readFileSync(storePath, 'utf-8')) as RateLimitStore;
}

export function saveRateLimitStore(storePath: string, store: RateLimitStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addRule(store: RateLimitStore, rule: RateLimitRule): RateLimitStore {
  const existing = store.rules.findIndex(r => r.key === rule.key);
  const rules = existing >= 0
    ? store.rules.map((r, i) => (i === existing ? rule : r))
    : [...store.rules, rule];
  return { ...store, rules };
}

export function removeRule(store: RateLimitStore, key: string): RateLimitStore {
  return { ...store, rules: store.rules.filter(r => r.key !== key) };
}

export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  nowMs: number = Date.now()
): { allowed: boolean; remaining: number; resetAt: number } {
  const rule = store.rules.find(r => r.key === key);
  if (!rule) return { allowed: true, remaining: Infinity, resetAt: 0 };

  const windowMs = rule.windowSeconds * 1000;
  const entry = store.entries.find(e => e.key === key);

  if (!entry || nowMs - entry.windowStart >= windowMs) {
    return { allowed: true, remaining: rule.maxRequests - 1, resetAt: nowMs + windowMs };
  }

  const remaining = rule.maxRequests - entry.count;
  const resetAt = entry.windowStart + windowMs;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining), resetAt };
}

export function recordRequest(
  store: RateLimitStore,
  key: string,
  nowMs: number = Date.now()
): RateLimitStore {
  const rule = store.rules.find(r => r.key === key);
  if (!rule) return store;

  const windowMs = rule.windowSeconds * 1000;
  const idx = store.entries.findIndex(e => e.key === key);

  let entries: RateLimitEntry[];
  if (idx < 0) {
    entries = [...store.entries, { key, count: 1, windowStart: nowMs }];
  } else {
    const entry = store.entries[idx];
    const reset = nowMs - entry.windowStart >= windowMs;
    entries = store.entries.map((e, i) =>
      i === idx ? { key, count: reset ? 1 : e.count + 1, windowStart: reset ? nowMs : e.windowStart } : e
    );
  }
  return { ...store, entries };
}

export function formatRateLimitList(store: RateLimitStore): string {
  if (store.rules.length === 0) return 'No rate limit rules defined.';
  return store.rules
    .map(r => `${r.key}: ${r.maxRequests} req / ${r.windowSeconds}s`)
    .join('\n');
}
