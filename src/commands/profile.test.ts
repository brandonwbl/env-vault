import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadProfiles,
  saveProfiles,
  addProfile,
  removeProfile,
  switchProfile,
  getActiveProfile,
  formatProfileList,
} from './profile';

function tmpProfilePath(): string {
  return path.join(os.tmpdir(), `profiles-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe('profile', () => {
  let filePath: string;

  beforeEach(() => {
    filePath = tmpProfilePath();
  });

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('loadProfiles returns empty store when file does not exist', () => {
    const store = loadProfiles(filePath);
    expect(store.active).toBeNull();
    expect(store.profiles).toEqual({});
  });

  it('addProfile creates a new profile and sets it as active', () => {
    const store = addProfile('dev', '/tmp/dev.vault', 'Development', filePath);
    expect(store.profiles['dev']).toBeDefined();
    expect(store.profiles['dev'].vaultPath).toBe('/tmp/dev.vault');
    expect(store.active).toBe('dev');
  });

  it('addProfile does not overwrite active when one already exists', () => {
    addProfile('dev', '/tmp/dev.vault', undefined, filePath);
    addProfile('prod', '/tmp/prod.vault', undefined, filePath);
    const store = loadProfiles(filePath);
    expect(store.active).toBe('dev');
  });

  it('removeProfile removes the profile', () => {
    addProfile('dev', '/tmp/dev.vault', undefined, filePath);
    const store = removeProfile('dev', filePath);
    expect(store.profiles['dev']).toBeUndefined();
  });

  it('removeProfile updates active to another profile when active is removed', () => {
    addProfile('dev', '/tmp/dev.vault', undefined, filePath);
    addProfile('prod', '/tmp/prod.vault', undefined, filePath);
    switchProfile('dev', filePath);
    const store = removeProfile('dev', filePath);
    expect(store.active).toBe('prod');
  });

  it('removeProfile throws when profile not found', () => {
    expect(() => removeProfile('nonexistent', filePath)).toThrow('Profile "nonexistent" not found.');
  });

  it('switchProfile changes active profile', () => {
    addProfile('dev', '/tmp/dev.vault', undefined, filePath);
    addProfile('prod', '/tmp/prod.vault', undefined, filePath);
    const store = switchProfile('prod', filePath);
    expect(store.active).toBe('prod');
  });

  it('switchProfile throws when profile not found', () => {
    expect(() => switchProfile('ghost', filePath)).toThrow('Profile "ghost" not found.');
  });

  it('getActiveProfile returns null when no profiles', () => {
    expect(getActiveProfile(filePath)).toBeNull();
  });

  it('getActiveProfile returns the active profile', () => {
    addProfile('dev', '/tmp/dev.vault', 'Dev env', filePath);
    const profile = getActiveProfile(filePath);
    expect(profile?.name).toBe('dev');
    expect(profile?.description).toBe('Dev env');
  });

  it('formatProfileList shows no profiles message', () => {
    const store = loadProfiles(filePath);
    expect(formatProfileList(store)).toBe('No profiles defined.');
  });

  it('formatProfileList marks active profile', () => {
    addProfile('dev', '/tmp/dev.vault', 'Dev', filePath);
    addProfile('prod', '/tmp/prod.vault', undefined, filePath);
    const);
    const output = formatProfileList(store);
    expect(output).toContain('dev (active)');
    expect(output).toContain('prod');
    expect(output).toContain('');
  });
});
