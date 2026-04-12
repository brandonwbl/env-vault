import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  backupVault,
  listBackups,
  formatBackupList,
  getBackupPath,
} from "./backup";
import { createVault, writeVault } from "../crypto";

const TEST_PASSWORD = "test-password-123";

async function createTmpVault(dir: string, name = "test.vault"): Promise<string> {
  const vaultPath = path.join(dir, name);
  const vault = createVault();
  vault.entries["KEY"] = { value: "value", tags: [] };
  await writeVault(vaultPath, vault, TEST_PASSWORD);
  return vaultPath;
}

describe("getBackupPath", () => {
  it("returns a path with timestamp and .vault extension", () => {
    const result = getBackupPath("/some/dir/my.vault");
    expect(result).toMatch(/my\.backup\..+\.vault$/);
    expect(path.dirname(result)).toBe("/some/dir");
  });

  it("uses custom backupDir when provided", () => {
    const result = getBackupPath("/some/dir/my.vault", "/backups");
    expect(path.dirname(result)).toBe("/backups");
  });
});

describe("backupVault", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-vault-backup-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a backup file in the same directory", async () => {
    const vaultPath = await createTmpVault(tmpDir);
    const backupPath = await backupVault({ vaultPath, password: TEST_PASSWORD });
    expect(fs.existsSync(backupPath)).toBe(true);
  });

  it("creates a backup file in a custom directory", async () => {
    const vaultPath = await createTmpVault(tmpDir);
    const backupDir = path.join(tmpDir, "backups");
    const backupPath = await backupVault({ vaultPath, backupDir, password: TEST_PASSWORD });
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(path.dirname(backupPath)).toBe(backupDir);
  });

  it("throws if vault does not exist", async () => {
    await expect(
      backupVault({ vaultPath: "/nonexistent/vault.vault", password: TEST_PASSWORD })
    ).rejects.toThrow("Vault not found");
  });
});

describe("listBackups", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-vault-list-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array when no backups exist", () => {
    const vaultPath = path.join(tmpDir, "test.vault");
    expect(listBackups(vaultPath)).toEqual([]);
  });

  it("returns sorted list of backup files", async () => {
    const vaultPath = await createTmpVault(tmpDir);
    await backupVault({ vaultPath, password: TEST_PASSWORD });
    await backupVault({ vaultPath, password: TEST_PASSWORD });
    const backups = listBackups(vaultPath);
    expect(backups.length).toBe(2);
    expect(backups[0] <= backups[1]).toBe(true);
  });
});

describe("formatBackupList", () => {
  it("returns message when no backups", () => {
    expect(formatBackupList([])).toBe("No backups found.");
  });

  it("formats backup list with indices", () => {
    const result = formatBackupList(["/dir/test.backup.2024-01-01_12-00-00.vault"]);
    expect(result).toContain("[1]");
    expect(result).toContain("test.backup.2024-01-01_12-00-00.vault");
  });
});
