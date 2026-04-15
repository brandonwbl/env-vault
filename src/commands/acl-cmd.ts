import { Command } from "commander";
import {
  loadAcl,
  saveAcl,
  grantPermission,
  revokePermission,
  hasPermission,
  formatAcl,
} from "./acl";

type Permission = "read" | "write" | "delete";

function assertPermission(p: string): Permission {
  if (p === "read" || p === "write" || p === "delete") return p;
  throw new Error(`Invalid permission "${p}". Use read, write, or delete.`);
}

export function registerAclCommands(program: Command): void {
  const acl = program
    .command("acl")
    .description("Manage per-key access control lists");

  acl
    .command("grant <vaultPath> <key> <user> <permission>")
    .description("Grant a permission on a key to a user")
    .action((vaultPath, key, user, permission) => {
      const perm = assertPermission(permission);
      const store = loadAcl(vaultPath);
      const updated = grantPermission(store, key, user, perm);
      saveAcl(vaultPath, updated);
      console.log(`Granted ${perm} on "${key}" to ${user}.`);
    });

  acl
    .command("revoke <vaultPath> <key> <user> <permission>")
    .description("Revoke a permission on a key from a user")
    .action((vaultPath, key, user, permission) => {
      const perm = assertPermission(permission);
      const store = loadAcl(vaultPath);
      const updated = revokePermission(store, key, user, perm);
      saveAcl(vaultPath, updated);
      console.log(`Revoked ${perm} on "${key}" from ${user}.`);
    });

  acl
    .command("check <vaultPath> <key> <user> <permission>")
    .description("Check if a user has a permission on a key")
    .action((vaultPath, key, user, permission) => {
      const perm = assertPermission(permission);
      const store = loadAcl(vaultPath);
      const allowed = hasPermission(store, key, user, perm);
      console.log(allowed ? "allowed" : "denied");
      if (!allowed) process.exit(1);
    });

  acl
    .command("list <vaultPath>")
    .description("List all ACL entries for the vault")
    .action((vaultPath) => {
      const store = loadAcl(vaultPath);
      console.log(formatAcl(store));
    });
}
