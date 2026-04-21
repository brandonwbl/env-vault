import { Command } from 'commander';
import {
  getPipelinePath,
  loadPipelineStore,
  savePipelineStore,
  addPipeline,
  removePipeline,
  findPipeline,
  executePipeline,
  formatPipelineList,
} from './pipeline';
import { stepsFromString, pipelineToString } from './pipeline-utils';
import { readVault } from '../crypto';

export function registerPipelineCommands(program: Command): void {
  const pipeline = program.command('pipeline').description('Manage and run pipelines');

  pipeline
    .command('add <name> <steps>')
    .description('Add a pipeline (steps: "cmd1:key=val,cmd2:key=val")')
    .option('-v, --vault <path>', 'vault path', 'vault.enc')
    .action((name: string, stepsRaw: string, opts: { vault: string }) => {
      const storePath = getPipelinePath(opts.vault);
      const store = loadPipelineStore(storePath);
      const steps = stepsFromString(stepsRaw);
      const p = addPipeline(store, name, steps);
      savePipelineStore(storePath, store);
      console.log(`Pipeline '${p.name}' added with ${p.steps.length} step(s).`);
    });

  pipeline
    .command('remove <name>')
    .description('Remove a pipeline')
    .option('-v, --vault <path>', 'vault path', 'vault.enc')
    .action((name: string, opts: { vault: string }) => {
      const storePath = getPipelinePath(opts.vault);
      const store = loadPipelineStore(storePath);
      const removed = removePipeline(store, name);
      if (!removed) { console.error(`Pipeline '${name}' not found.`); process.exit(1); }
      savePipelineStore(storePath, store);
      console.log(`Pipeline '${name}' removed.`);
    });

  pipeline
    .command('list')
    .description('List all pipelines')
    .option('-v, --vault <path>', 'vault path', 'vault.enc')
    .action((opts: { vault: string }) => {
      const store = loadPipelineStore(getPipelinePath(opts.vault));
      console.log(formatPipelineList(store));
    });

  pipeline
    .command('run <name>')
    .description('Run a pipeline against the vault')
    .requiredOption('-p, --password <password>', 'vault password')
    .option('-v, --vault <path>', 'vault path', 'vault.enc')
    .action(async (name: string, opts: { password: string; vault: string }) => {
      const store = loadPipelineStore(getPipelinePath(opts.vault));
      const p = findPipeline(store, name);
      if (!p) { console.error(`Pipeline '${name}' not found.`); process.exit(1); }
      const vault = await readVault(opts.vault, opts.password);
      const results = executePipeline(p, vault.entries);
      results.forEach((r) => console.log(`[${r.success ? 'OK' : 'FAIL'}] ${r.step}: ${r.message}`));
    });

  pipeline
    .command('show <name>')
    .description('Show pipeline details')
    .option('-v, --vault <path>', 'vault path', 'vault.enc')
    .action((name: string, opts: { vault: string }) => {
      const store = loadPipelineStore(getPipelinePath(opts.vault));
      const p = findPipeline(store, name);
      if (!p) { console.error(`Pipeline '${name}' not found.`); process.exit(1); }
      console.log(pipelineToString(p));
    });
}
