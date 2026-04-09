import fs from 'fs';
import path from 'path';
import { encrypt, decrypt, EncryptedPayload } from './encryption';

export interface VaultData {
  version: number;
  entries: Record<string, string>;
}

export interface VaultFile {
  version: number;
  payload: EncryptedPayload;
}

const VAULT_VERSION = 1;

export function createVault(entries: Record<string, string> = {}): VaultData {
  return { version: VAULT_VERSION, entries };
}

export function serializeVault(vault: VaultData, password: string): string {
  const plaintext = JSON.stringify(vault);
  const payload = encrypt(plaintext, password);
  const vaultFile: VaultFile = { version: VAULT_VERSION, payload };
  return JSON.stringify(vaultFile, null, 2);
}

export function deserializeVault(raw: string, password: string): VaultData {
  const vaultFile: VaultFile = JSON.parse(raw);
  if (vaultFile.version !== VAULT_VERSION) {
    throw new Error(`Unsupported vault version: ${vaultFile.version}`);
  }
  const plaintext = decrypt(vaultFile.payload, password);
  return JSON.parse(plaintext) as VaultData;
}

export function writeVault(filePath: string, vault: VaultData, password: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, serializeVault(vault, password), 'utf8');
}

export function readVault(filePath: string, password: string): VaultData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Vault file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return deserializeVault(raw, password);
}
