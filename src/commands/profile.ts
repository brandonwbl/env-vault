import * as fs from 'fs';
import * as path from 'path';

export interface Profile {
  name: string;
  vaultPath: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStore {
  active: string | null;
  profiles: Record<string, Profile>;
}

const PROFILES_FILE = path.join(process.env.HOME || '.', '.env-vault', 'profiles.json');

export function getProfilesPath(): string {
  return PROFILES_FILE;
}

export function loadProfiles(filePath: string = PROFILES_FILE): ProfileStore {
  if (!fs.existsSync(filePath)) {
    return { active: null, profiles: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ProfileStore;
}

export function saveProfiles(store: ProfileStore, filePath: string = PROFILES_FILE): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addProfile(name: string, vaultPath: string, description: string | undefined, filePath?: string): ProfileStore {
  const store = loadProfiles(filePath);
  const now = new Date().toISOString();
  store.profiles[name] = { name, vaultPath, description, createdAt: now, updatedAt: now };
  if (!store.active) store.active = name;
  saveProfiles(store, filePath);
  return store;
}

export function removeProfile(name: string, filePath?: string): ProfileStore {
  const store = loadProfiles(filePath);
  if (!store.profiles[name]) throw new Error(`Profile "${name}" not found.`);
  delete store.profiles[name];
  if (store.active === name) {
    const remaining = Object.keys(store.profiles);
    store.active = remaining.length > 0 ? remaining[0] : null;
  }
  saveProfiles(store, filePath);
  return store;
}

export function switchProfile(name: string, filePath?: string): ProfileStore {
  const store = loadProfiles(filePath);
  if (!store.profiles[name]) throw new Error(`Profile "${name}" not found.`);
  store.active = name;
  saveProfiles(store, filePath);
  return store;
}

export function getActiveProfile(filePath?: string): Profile | null {
  const store = loadProfiles(filePath);
  if (!store.active) return null;
  return store.profiles[store.active] ?? null;
}

export function formatProfileList(store: ProfileStore): string {
  const names = Object.keys(store.profiles);
  if (names.length === 0) return 'No profiles defined.';
  return names
    .map(n => {
      const p = store.profiles[n];
      const active = store.active === n ? ' (active)' : '';
      const desc = p.description ? ` — ${p.description}` : '';
      return `  ${n}${active}${desc}\n    vault: ${p.vaultPath}`;
    })
    .join('\n');
}
