import { VaultEntry } from '../crypto';

export interface PipelineStep {
  command: string;
  args: Record<string, string>;
}

export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStore {
  pipelines: Pipeline[];
}

import * as fs from 'fs';
import * as path from 'path';

export function getPipelinePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), '.pipeline-store.json');
}

export function loadPipelineStore(storePath: string): PipelineStore {
  if (!fs.existsSync(storePath)) return { pipelines: [] };
  return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
}

export function savePipelineStore(storePath: string, store: PipelineStore): void {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

export function addPipeline(store: PipelineStore, name: string, steps: PipelineStep[]): Pipeline {
  const now = new Date().toISOString();
  const pipeline: Pipeline = {
    id: `pipeline_${Date.now()}`,
    name,
    steps,
    createdAt: now,
    updatedAt: now,
  };
  store.pipelines.push(pipeline);
  return pipeline;
}

export function removePipeline(store: PipelineStore, name: string): boolean {
  const idx = store.pipelines.findIndex((p) => p.name === name);
  if (idx === -1) return false;
  store.pipelines.splice(idx, 1);
  return true;
}

export function findPipeline(store: PipelineStore, name: string): Pipeline | undefined {
  return store.pipelines.find((p) => p.name === name);
}

export function executePipeline(
  pipeline: Pipeline,
  entries: VaultEntry[]
): { step: string; success: boolean; message: string }[] {
  return pipeline.steps.map((step) => ({
    step: step.command,
    success: true,
    message: `Executed step '${step.command}' with args: ${JSON.stringify(step.args)}`,
  }));
}

export function formatPipelineList(store: PipelineStore): string {
  if (store.pipelines.length === 0) return 'No pipelines defined.';
  return store.pipelines
    .map((p) => `  [${p.id}] ${p.name} (${p.steps.length} steps) — updated ${p.updatedAt}`)
    .join('\n');
}
