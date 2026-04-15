import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getAclPath,
  loadAcl,
  saveAcl,
  grantPermission,
  revokePermission,
  hasPermission,
  formatAcl,
  AclStore,
} from "./acl";

let tmpVaultPath: string;

beforeEach(() => {
  tmpVaultPath = path.join(os.tmpdir(), `test-vault-${Date.now()}.vault`);
});

afterEach(() => {
  const aclPath = getAclPath(tmpVaultPath);
  if (fs.existsSync(aclPath)) fs.unlinkSync(aclPath);
});

test("getAclPath returns sibling .acl.json file", () => {
  const result = getAclPath("/some/path/my.vault");
  expect(result).toBe("/some/path/my.acl.json");
});

test("loadAcl returns empty object when no file exists", () => {
  expect(loadAcl(tmpVaultPath)).toEqual({});
});

test("saveAcl and loadAcl round-trip", () => {
  const store: AclStore = {
    MY_KEY: [{ user: "alice", permissions: ["read"] }],
  };
  saveAcl(tmpVaultPath, store);
  expect(loadAcl(tmpVaultPath)).toEqual(store);
});

test("grantPermission adds new user entry", () => {
  const store = grantPermission({}, "API_KEY", "bob", "read");
  expect(store["API_KEY"]).toEqual([{ user: "bob", permissions: ["read"] }]);
});

test("grantPermission appends permission to existing user", () => {
  let store: AclStore = { API_KEY: [{ user: "bob", permissions: ["read"] }] };
  store = grantPermission(store, "API_KEY", "bob", "write");
  expect(store["API_KEY"][0].permissions).toEqual(["read", "write"]);
});

test("grantPermission does not duplicate permission", () => {
  let store: AclStore = { API_KEY: [{ user: "bob", permissions: ["read"] }] };
  store = grantPermission(store, "API_KEY", "bob", "read");
  expect(store["API_KEY"][0].permissions).toEqual(["read"]);
});

test("revokePermission removes a specific permission", () => {
  let store: AclStore = {
    API_KEY: [{ user: "alice", permissions: ["read", "write"] }],
  };
  store = revokePermission(store, "API_KEY", "alice", "write");
  expect(store["API_KEY"][0].permissions).toEqual(["read"]);
});

test("revokePermission removes entry when no permissions remain", () => {
  let store: AclStore = {
    API_KEY: [{ user: "alice", permissions: ["read"] }],
  };
  store = revokePermission(store, "API_KEY", "alice", "read");
  expect(store["API_KEY"]).toEqual([]);
});

test("hasPermission returns true when user has permission", () => {
  const store: AclStore = {
    DB_PASS: [{ user: "carol", permissions: ["read", "delete"] }],
  };
  expect(hasPermission(store, "DB_PASS", "carol", "delete")).toBe(true);
});

test("hasPermission returns false when user lacks permission", () => {
  const store: AclStore = {
    DB_PASS: [{ user: "carol", permissions: ["read"] }],
  };
  expect(hasPermission(store, "DB_PASS", "carol", "write")).toBe(false);
});

test("hasPermission returns false for unknown user", () => {
  expect(hasPermission({}, "SOME_KEY", "ghost", "read")).toBe(false);
});

test("formatAcl returns message when empty", () => {
  expect(formatAcl({})).toBe("No ACL entries found.");
});

test("formatAcl formats entries correctly", () => {
  const store: AclStore = {
    SECRET: [{ user: "dave", permissions: ["read", "write"] }],
  };
  const output = formatAcl(store);
  expect(output).toContain("SECRET");
  expect(output).toContain("dave");
  expect(output).toContain("read, write");
});
