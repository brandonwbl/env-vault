import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildAuditReport,
  saveAuditReport,
  loadAuditReport,
  formatAuditReport,
} from './audit-report';
import { AuditIssue } from './audit';

const tmpReport = path.join(os.tmpdir(), `audit-report-${Date.now()}.json`);

afterEach(() => {
  if (fs.existsSync(tmpReport)) fs.unlinkSync(tmpReport);
});

const sampleIssues: AuditIssue[] = [
  { key: 'DB_PASS', severity: 'high', message: 'Secret value is suspiciously short' },
  { key: 'NODE_ENV', severity: 'low', message: 'Unusually long value' },
];

describe('buildAuditReport', () => {
  it('builds report with correct summary counts', () => {
    const report = buildAuditReport('/path/to/vault', sampleIssues);
    expect(report.summary.high).toBe(1);
    expect(report.summary.low).toBe(1);
    expect(report.summary.medium).toBe(0);
    expect(report.totalIssues).toBe(2);
  });

  it('includes vaultPath and generatedAt', () => {
    const report = buildAuditReport('/some/vault', []);
    expect(report.vaultPath).toBe('/some/vault');
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('saveAuditReport / loadAuditReport', () => {
  it('round-trips a report through the filesystem', () => {
    const report = buildAuditReport('/vault', sampleIssues);
    saveAuditReport(report, tmpReport);
    const loaded = loadAuditReport(tmpReport);
    expect(loaded.totalIssues).toBe(2);
    expect(loaded.issues[0].key).toBe('DB_PASS');
  });
});

describe('formatAuditReport', () => {
  it('includes all expected sections', () => {
    const report = buildAuditReport('/vault', sampleIssues);
    const output = formatAuditReport(report);
    expect(output).toContain('Audit Report');
    expect(output).toContain('Total Issues: 2');
    expect(output).toContain('HIGH');
    expect(output).toContain('DB_PASS');
  });

  it('omits Issues section when no issues', () => {
    const report = buildAuditReport('/vault', []);
    const output = formatAuditReport(report);
    expect(output).not.toContain('Issues:');
  });
});
