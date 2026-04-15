import * as fs from "fs";
import * as path from "path";

export interface AclEntry {
  user: string;
  permissions: ("read" | "write" | "delete")[];
}

export interface AclStore {
  [key: string]: AclEntry[];
}

export function getAclPath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.acl.json`);
}

export function loadAcl(vaultPath: string): AclStore {
  const aclPath = getAclPath(vaultPath);
  if (!fs.existsSync(aclPath)) return {};
  return JSON.parse(fs.readFileSync(aclPath, "utf-8"));
}

export function saveAcl(vaultPath: string, store: AclStore): void {
  const aclPath = getAclPath(vaultPath);
  fs.writeFileSync(aclPath, JSON.stringify(store, null, 2));
}

export function grantPermission(
  store: AclStore,
  key: string,
  user: string,
  permission: "read" | "write" | "delete"
): AclStore {
  const entries = store[key] ?? [];
  const existing = entries.find((e) => e.user === user);
  if (existing) {
    if (!existing.permissions.includes(permission)) {
      existing.permissions.push(permission);
    }
  } else {
    entries.push({ user, permissions: [permission] });
  }
  return { ...store, [key]: entries };
}

export function revokePermission(
  store: AclStore,
  key: string,
  user: string,
  permission: "read" | "write" | "delete"
): AclStore {
  const entries = (store[key] ?? []).map((e) =>
    e.user === user
      ? { ...e, permissions: e.permissions.filter((p) => p !== permission) }
      : e
  ).filter((e) => e.permissions.length > 0);
  return { ...store, [key]: entries };
}

export function hasPermission(
  store: AclStore,
  key: string,
  user: string,
  permission: "read" | "write" | "delete"
): boolean {
  const entries = store[key] ?? [];
  const entry = entries.find((e) => e.user === user);
  return entry ? entry.permissions.includes(permission) : false;
}

export function formatAcl(store: AclStore): string {
  const keys = Object.keys(store);
  if (keys.length === 0) return "No ACL entries found.";
  return keys
    .map((key) => {
      const entries = store[key];
      const lines = entries.map(
        (e) => `  ${e.user}: ${e.permissions.join(", ")}`
      );
      return `${key}:\n${lines.join("\n")}`;
    })
    .join("\n");
}
