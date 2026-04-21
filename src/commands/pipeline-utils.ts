import { Pipeline, PipelineStep } from './pipeline';

export function pipelineToString(pipeline: Pipeline): string {
  const stepLines = pipeline.steps
    .map((s, i) => `  ${i + 1}. ${s.command} ${JSON.stringify(s.args)}`)
    .join('\n');
  return `Pipeline: ${pipeline.name}\nSteps:\n${stepLines}`;
}

export function stepsFromString(raw: string): PipelineStep[] {
  return raw.split(',').map((part) => {
    const [command, ...argParts] = part.trim().split(':');
    const args: Record<string, string> = {};
    argParts.forEach((ap) => {
      const [k, v] = ap.split('=');
      if (k && v) args[k.trim()] = v.trim();
    });
    return { command: command.trim(), args };
  });
}

export function mergePipelineStores(
  base: Pipeline[],
  incoming: Pipeline[]
): Pipeline[] {
  const map = new Map<string, Pipeline>(base.map((p) => [p.name, p]));
  for (const p of incoming) {
    if (!map.has(p.name)) map.set(p.name, p);
  }
  return Array.from(map.values());
}

export function summarizePipeline(pipeline: Pipeline): string {
  return `${pipeline.name}: ${pipeline.steps.map((s) => s.command).join(' → ')}`;
}
