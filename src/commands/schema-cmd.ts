import { Command } from 'commander';
import fs from 'fs';
import { readVault, deserializeVault } from '../crypto';
import { schemaFromJson, validateSchema, formatSchemaViolations } from './schema';

export function registerSchemaCommands(program: Command): void {
  const schema = program.command('schema').description('Schema validation commands');

  schema
    .command('validate <vaultPath> <schemaPath>')
    .description('Validate vault entries against a JSON schema file')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultPath: string, schemaPath: string, opts: { password?: string }) => {
      const password = opts.password ?? process.env.VAULT_PASSWORD ?? '';
      if (!password) {
        console.error('Password required');
        process.exit(1);
      }
      if (!fs.existsSync(schemaPath)) {
        console.error(`Schema file not found: ${schemaPath}`);
        process.exit(1);
      }
      const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      const schemaDef = schemaFromJson(raw);
      const serialized = readVault(vaultPath);
      const vault = await deserializeVault(serialized, password);
      const violations = validateSchema(vault.entries, schemaDef);
      console.log(formatSchemaViolations(violations));
      if (violations.length > 0) process.exit(1);
    });

  schema
    .command('show <schemaPath>')
    .description('Display schema fields')
    .action((schemaPath: string) => {
      if (!fs.existsSync(schemaPath)) {
        console.error(`Schema file not found: ${schemaPath}`);
        process.exit(1);
      }
      const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      const schemaDef = schemaFromJson(raw);
      for (const f of schemaDef.fields) {
        const req = f.required ? '[required]' : '[optional]';
        const pat = f.pattern ? ` pattern=${f.pattern}` : '';
        console.log(`  ${f.key} ${req}${pat}${f.description ? ' — ' + f.description : ''}`);
      }
    });
}
