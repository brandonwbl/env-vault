import { Command } from 'commander';
import { templateCommand, applyTemplate } from './template';
import { parseEnv } from '../env';
import { readFile } from 'fs/promises';

export function registerTemplateCommands(program: Command): void {
  const tmpl = program
    .command('template')
    .description('Manage vault templates');

  tmpl
    .command('export')
    .description('Export vault keys as a blank .env template')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .option('-o, --output <path>', 'Write template to file')
    .action(async (opts) => {
      try {
        const rendered = await templateCommand(opts.vault, opts.password, opts.output);
        if (!opts.output) {
          console.log(rendered);
        } else {
          console.log(`Template written to ${opts.output}`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  tmpl
    .command('apply')
    .description('Apply values from a .env file into the vault')
    .requiredOption('-v, --vault <path>', 'Path to vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .requiredOption('-f, --file <path>', 'Path to .env file with values')
    .option('--strict', 'Fail if any required keys are missing', false)
    .action(async (opts) => {
      try {
        const raw = await readFile(opts.file, 'utf-8');
        const values = parseEnv(raw);
        await applyTemplate(opts.vault, opts.password, values, opts.strict);
        console.log(`Applied ${Object.keys(values).length} value(s) to vault.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
