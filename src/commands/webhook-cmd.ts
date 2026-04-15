import { Command } from 'commander';
import {
  addWebhook,
  removeWebhook,
  loadWebhooks,
  formatWebhookList,
} from './webhook';

const DEFAULT_EVENTS = ['add', 'remove', 'rotate', 'import'];

export function registerWebhookCommands(program: Command): void {
  const webhook = program
    .command('webhook')
    .description('Manage vault webhooks for event notifications');

  webhook
    .command('add <url>')
    .description('Register a new webhook endpoint')
    .option('-v, --vault <path>', 'vault file path', 'vault.enc')
    .option(
      '-e, --events <events>',
      'comma-separated list of events',
      DEFAULT_EVENTS.join(',')
    )
    .action((url: string, opts: { vault: string; events: string }) => {
      const events = opts.events.split(',').map((e) => e.trim());
      const hook = addWebhook(opts.vault, url, events);
      console.log(`Webhook registered: ${hook.id}`);
      console.log(`Secret: ${hook.secret}`);
    });

  webhook
    .command('remove <id>')
    .description('Remove a registered webhook by ID prefix')
    .option('-v, --vault <path>', 'vault file path', 'vault.enc')
    .action((id: string, opts: { vault: string }) => {
      const hooks = loadWebhooks(opts.vault);
      const match = hooks.find((w) => w.id.startsWith(id));
      if (!match) {
        console.error(`No webhook found matching id: ${id}`);
        process.exit(1);
      }
      removeWebhook(opts.vault, match.id);
      console.log(`Webhook ${match.id} removed.`);
    });

  webhook
    .command('list')
    .description('List all registered webhooks')
    .option('-v, --vault <path>', 'vault file path', 'vault.enc')
    .action((opts: { vault: string }) => {
      const hooks = loadWebhooks(opts.vault);
      console.log(formatWebhookList(hooks));
    });
}
