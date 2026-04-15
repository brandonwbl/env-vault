import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import {
  createShareToken,
  redeemShareToken,
  listShareTokens,
  formatShareList,
  getShareDir,
} from './share';

export function registerShareCommands(program: Command): void {
  const share = program.command('share').description('Manage share tokens for vault entries');

  share
    .command('create <vaultPath>')
    .description('Create a share token for selected keys')
    .requiredOption('-p, --password <password>', 'Vault password')
    .requiredOption('-s, --share-password <sharePassword>', 'Password to protect the share token')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to share (default: all)', '')
    .option('--ttl <seconds>', 'Token TTL in seconds')
    .action(async (vaultPath: string, opts) => {
      const keys = opts.keys ?map((k: string) => k.trim()).filter(Boolean) : [];
      const ttl = opts.ttl ? parseInt(opts.ttl, 10) : undefined;
      try {
        const token = await createShareToken(vaultPath, opts.password, opts.sharePassword, keys, ttl);
        const tokenPath = path.join(getShareDir(vaultPath), `${token.id}.json`);
        console.log(`Share token created: ${token.id}`);
        console.log(`Keys: ${token.keys.join(', ')}`);
        console.log(`Token file: ${tokenPath}`);
        if (token.expiresAt) console.log(`Expires: ${token.expiresAt}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  share
    .command('redeem <tokenPath> <targetVaultPath>')
    .description('Redeem a share token and import entries into a vault')
    .requiredOption('-s, --share-password <sharePassword>', 'Password used when creating the token')
    .requiredOption('-p, --password <password>', 'Target vault password')
    .action(async (tokenPath: string, targetVaultPath: string, opts) => {
      try {
        const imported = await redeemShareToken(tokenPath, opts.sharePassword, targetVaultPath, opts.password);
        console.log(`Imported ${imported.length} key(s): ${imported.join(', ')}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  share
    .command('list <vaultPath>')
    .description('List all share tokens for a vault')
    .action((vaultPath: string) => {
      const tokens = listShareTokens(vaultPath);
      console.log(formatShareList(tokens));
    });

  share
    .command('revoke <vaultPath> <tokenId>')
    .description('Revoke (delete) a share token')
    .action((vaultPath: string, tokenId: string) => {
      const tokenPath = path.join(getShareDir(vaultPath), `${tokenId}.json`);
      if (!fs.existsSync(tokenPath)) {
        console.error(`Token not found: ${tokenId}`);
        process.exit(1);
      }
      fs.unlinkSync(tokenPath);
      console.log(`Token ${tokenId} revoked.`);
    });
}
