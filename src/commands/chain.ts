import { VaultEntry } from '../crypto';

export interface ChainStep {
  command: string;
  args: string[];
}

export interface ChainDefinition {
  name: string;
  steps: ChainStep[];
  createdAt: string;
}

export interface ChainStore {
  chains: Record<string, ChainDefinition>;
}

export function getChainPath(vaultPath: string): string {
  return vaultPath.replace(/\.vault$/, '.chains.json');
}

export function emptyChainStore(): ChainStore {
  return { chains: {} };
}

import * as fs from 'fs';

export function loadChainStore(chainPath: string): ChainStore {
  if (!fs.existsSync(chainPath)) return emptyChainStore();
  try {
    return JSON.parse(fs.readFileSync(chainPath, 'utf-8')) as ChainStore;
  } catch {
    return emptyChainStore();
  }
}

export function saveChainStore(chainPath: string, store: ChainStore): void {
  fs.writeFileSync(chainPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addChain(store: ChainStore, name: string, steps: ChainStep[]): ChainStore {
  return {
    ...store,
    chains: {
      ...store.chains,
      [name]: { name, steps, createdAt: new Date().toISOString() },
    },
  };
}

export function removeChain(store: ChainStore, name: string): ChainStore {
  const chains = { ...store.chains };
  delete chains[name];
  return { ...store, chains };
}

export function getChain(store: ChainStore, name: string): ChainDefinition | undefined {
  return store.chains[name];
}

export function formatChainList(store: ChainStore): string {
  const names = Object.keys(store.chains);
  if (names.length === 0) return 'No chains defined.';
  return names
    .map((name) => {
      const chain = store.chains[name];
      const stepCount = chain.steps.length;
      return `  ${name} (${stepCount} step${stepCount !== 1 ? 's' : ''}) — created ${chain.createdAt.slice(0, 10)}`;
    })
    .join('\n');
}

export function formatChainDetail(chain: ChainDefinition): string {
  const lines = [`Chain: ${chain.name}`, `Created: ${chain.createdAt}`, 'Steps:'];
  chain.steps.forEach((step, i) => {
    lines.push(`  ${i + 1}. ${step.command} ${step.args.join(' ')}`);
  });
  return lines.join('\n');
}
