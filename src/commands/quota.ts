import * as fs from 'fs';
import * as path from 'path';

export interface QuotaConfig {
  maxKeys: number;
  maxValueLength: number;
  maxTotalSize: number; // bytes
}

export interface QuotaStore {
  config: QuotaConfig;
  updatedAt: string;
}

export interface QuotaCheckResult {
  passed: boolean;
  violations: string[];
}

const DEFAULT_QUOTA: QuotaConfig = {
  maxKeys: 500,
  maxValueLength: 4096,
  maxTotalSize: 1024 * 1024, // 1MB
};

export function getQuotaPath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.quota.json');
}

export function loadQuota(vaultPath: string): QuotaStore {
  const p = getQuotaPath(vaultPath);
  if (!fs.existsSync(p)) {
    return { config: { ...DEFAULT_QUOTA }, updatedAt: new Date().toISOString() };
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as QuotaStore;
}

export function saveQuota(vaultPath: string, store: QuotaStore): void {
  const p = getQuotaPath(vaultPath);
  fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf-8');
}

export function setQuota(vaultPath: string, config: Partial<QuotaConfig>): QuotaStore {
  const store = loadQuota(vaultPath);
  store.config = { ...store.config, ...config };
  store.updatedAt = new Date().toISOString();
  saveQuota(vaultPath, store);
  return store;
}

export function checkQuota(
  entries: Record<string, string>,
  config: QuotaConfig
): QuotaCheckResult {
  const violations: string[] = [];
  const keysn
  if (keys.length > config.maxKeys) {
    violations.push(`Key count ${keys.length} exceeds limit of ${config.maxKeys}`);
  }

  for (const [key, value] of Object.entries(entries)) {
    if (value.length > config.maxValueLength) {
      violations.push(`Value for "${key}" (${value.length} chars) exceeds max length of ${config.maxValueLength}`);
    }
  }

  const totalSize = Buffer.byteLength(JSON.stringify(entries), 'utf-8');
  if (totalSize > config.maxTotalSize) {
    violations.push(`Total size ${totalSize} bytes exceeds limit of ${config.maxTotalSize} bytes`);
  }

  return { passed: violations.length === 0, violations };
}

export function formatQuota(store: QuotaStore, result?: QuotaCheckResult): string {
  const { config } = store;
  const lines = [
    `Quota Configuration (updated: ${store.updatedAt})`,
    `  Max Keys       : ${config.maxKeys}`,
    `  Max Value Len  : ${config.maxValueLength} chars`,
    `  Max Total Size : ${config.maxTotalSize} bytes`,
  ];
  if (result) {
    lines.push('');
    lines.push(result.passed ? '✔ All quota checks passed.' : '✖ Quota violations:');
    for (const v of result.violations) {
      lines.push(`  - ${v}`);
    }
  }
  return lines.join('\n');
}
