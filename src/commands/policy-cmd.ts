import { Command } from 'commander';
import { addRule, removeRule, loadPolicy, enforcePolicy, formatPolicyViolations } from './policy';
import { readVault, deserializeVault } from '../crypto/vault';

export function registerPolicyCommands(program: Command): void {
  const policy = program.command('policy').description('Manage vault policies');

  policy
    .command('add <pattern>')
    .description('Add a policy rule for keys matching pattern')
    .option('--required', 'Key must exist')
    .option('--min-length <n>', 'Minimum value length', parseInt)
    .option('--max-length <n>', 'Maximum value length', parseInt)
    .requiredOption('--vault <path>', 'Vault file path')
    .action((pattern, opts) => {
      addRule(opts.vault, {
        pattern,
        required: opts.required,
        minLength: opts.minLength,
        maxLength: opts.maxLength,
      });
      console.log(`Policy rule added for pattern: ${pattern}`);
    });

  policy
    .command('remove <pattern>')
    .description('Remove a policy rule')
    .requiredOption('--vault <path>', 'Vault file path')
    .action((pattern, opts) => {
      removeRule(opts.vault, pattern);
      console.log(`Policy rule removed for pattern: ${pattern}`);
    });

  policy
    .command('list')
    .description('List all policy rules')
    .requiredOption('--vault <path>', 'Vault file path')
    .action((opts) => {
      const p = loadPolicy(opts.vault);
      if (p.rules.length === 0) { console.log('No policy rules defined.'); return; }
      p.rules.forEach(r => console.log(`${r.pattern}${r.required ? ' [required]' : ''}${r.minLength !== undefined ? ` min:${r.minLength}` : ''}${r.maxLength !== undefined ? ` max:${r.maxLength}` : ''}`));
    });

  policy
    .command('check')
    .description('Check vault entries against policy')
    .requiredOption('--vault <path>', 'Vault file path')
    .requiredOption('--password <password>', 'Vault password')
    .action(async (opts) => {
      const raw = readVault(opts.vault);
      const vault = deserializeVault(raw);
      const { decrypt } = await import('../crypto/encryption');
      const { deriveKey } = await import('../crypto/encryption');
      const key = await deriveKey(opts.password, Buffer.from(vault.salt, 'hex'));
      const plain = await decrypt(vault.data, key);
      const entries: Record<string, string> = JSON.parse(plain);
      const p = loadPolicy(opts.vault);
      const violations = enforcePolicy(entries, p);
      console.log(formatPolicyViolations(violations));
      if (violations.length > 0) process.exit(1);
    });
}
