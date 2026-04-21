/**
 * Circuit breaker for vault operations.
 * Prevents cascading failures by tracking operation error rates
 * and temporarily disabling operations that exceed thresholds.
 */

import * as fs from 'fs';
import * as path from 'path';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitEntry {
  operation: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt?: string;
  openedAt?: string;
  threshold: number;
  cooldownMs: number;
}

export interface CircuitBreakerStore {
  circuits: Record<string, CircuitEntry>;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;

export function getCircuitBreakerPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  return path.join(dir, '.circuit-breaker.json');
}

export function loadCircuitBreakerStore(storePath: string): CircuitBreakerStore {
  if (!fs.existsSync(storePath)) {
    return { circuits: {} };
  }
  const raw = fs.readFileSync(storePath, 'utf-8');
  return JSON.parse(raw) as CircuitBreakerStore;
}

export function saveCircuitBreakerStore(storePath: string, store: CircuitBreakerStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function getOrCreateCircuit(
  store: CircuitBreakerStore,
  operation: string,
  threshold = DEFAULT_THRESHOLD,
  cooldownMs = DEFAULT_COOLDOWN_MS
): CircuitEntry {
  if (!store.circuits[operation]) {
    store.circuits[operation] = {
      operation,
      state: 'closed',
      failures: 0,
      successes: 0,
      threshold,
      cooldownMs,
    };
  }
  return store.circuits[operation];
}

/**
 * Evaluate whether the circuit allows the operation to proceed.
 * Returns true if allowed, false if the circuit is open.
 */
export function isAllowed(circuit: CircuitEntry): boolean {
  if (circuit.state === 'closed') return true;
  if (circuit.state === 'open') {
    const openedAt = circuit.openedAt ? new Date(circuit.openedAt).getTime() : 0;
    const elapsed = Date.now() - openedAt;
    if (elapsed >= circuit.cooldownMs) {
      circuit.state = 'half-open';
      return true;
    }
    return false;
  }
  // half-open: allow one probe
  return true;
}

export function recordSuccess(circuit: CircuitEntry): void {
  circuit.successes += 1;
  if (circuit.state === 'half-open') {
    circuit.state = 'closed';
    circuit.failures = 0;
  }
}

export function recordFailure(circuit: CircuitEntry): void {
  circuit.failures += 1;
  circuit.lastFailureAt = new Date().toISOString();
  if (circuit.state === 'half-open' || circuit.failures >= circuit.threshold) {
    circuit.state = 'open';
    circuit.openedAt = new Date().toISOString();
  }
}

export function resetCircuit(circuit: CircuitEntry): void {
  circuit.state = 'closed';
  circuit.failures = 0;
  circuit.successes = 0;
  delete circuit.lastFailureAt;
  delete circuit.openedAt;
}

export function formatCircuitList(store: CircuitBreakerStore): string {
  const entries = Object.values(store.circuits);
  if (entries.length === 0) return 'No circuit breakers registered.';
  const lines = entries.map((c) => {
    const status =
      c.state === 'closed' ? '✅ closed' : c.state === 'open' ? '🔴 open' : '🟡 half-open';
    const last = c.lastFailureAt ? ` | last failure: ${c.lastFailureAt}` : '';
    return `  ${c.operation}: ${status} | failures: ${c.failures}/${c.threshold}${last}`;
  });
  return ['Circuit Breakers:', ...lines].join('\n');
}
