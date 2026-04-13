import * as fs from 'fs';
import { AuditIssue } from './audit';

export interface AuditReport {
  generatedAt: string;
  vaultPath: string;
  totalIssues: number;
  issues: AuditIssue[];
  summary: Record<string, number>;
}

export function buildAuditReport(vaultPath: string, issues: AuditIssue[]): AuditReport {
  const summary = { high: 0, medium: 0, low: 0 };
  for (const issue of issues) summary[issue.severity]++;

  return {
    generatedAt: new Date().toISOString(),
    vaultPath,
    totalIssues: issues.length,
    issues,
    summary,
  };
}

export function saveAuditReport(report: AuditReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

export function loadAuditReport(outputPath: string): AuditReport {
  const raw = fs.readFileSync(outputPath, 'utf-8');
  return JSON.parse(raw) as AuditReport;
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Audit Report`,
    `Generated: ${report.generatedAt}`,
    `Vault: ${report.vaultPath}`,
    `Total Issues: ${report.totalIssues}`,
    `  High: ${report.summary.high}  Medium: ${report.summary.medium}  Low: ${report.summary.low}`,
  ];

  if (report.issues.length > 0) {
    lines.push('\nIssues:');
    for (const issue of report.issues) {
      lines.push(`  [${issue.severity.toUpperCase()}] ${issue.key} — ${issue.message}`);
    }
  }

  return lines.join('\n');
}
