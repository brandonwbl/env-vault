import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAliasPath,
  loadAliases,
  saveAliases,
  setAlias,
  removeAlias,
  resolveAlias,
  formatAliasList,
} from './alias';

const tmpVaultPath = path.join(os.tmpdir(), 'test-vault.env.vault');
const tmpAliasPath = getAliasPath(tmpVaultPath);

afterEach(() => {
  if (fs.existsSync(tmpAliasPath)) fs.unlinkSync(tmpAliasPath);
});

describe('getAliasPath', () => {
  it('returns a sibling .aliases.json file path', () => {
    expect(tmpAliasPath).toMatch(/test-vault\.env\.aliases\.json$/);
  });
});

describe('loadAliases', () => {
  it('returns empty object when file does not exist', () => {
    expect(loadAliases(tmpAliasPath)).toEqual({});
  });

  it('returns parsed aliases when file exists', () => {
    fs.writeFileSync(tmpAliasPath, JSON.stringify({ db: 'DATABASE_URL' }));
    expect(loadAliases(tmpAliasPath)).toEqual({ db: 'DATABASE_URL' });
  });
});

describe('saveAliases / loadAliases round-trip', () => {
  it('persists and reloads aliases', () => {
    const aliases = { db: 'DATABASE_URL', api: 'API_KEY' };
    saveAliases(tmpAliasPath, aliases);
    expect(loadAliases(tmpAliasPath)).toEqual(aliases);
  });
});

describe('setAlias', () => {
  it('adds a new alias', () => {
    const result = setAlias({}, 'db', 'DATABASE_URL');
    expect(result).toEqual({ db: 'DATABASE_URL' });
  });

  it('throws on empty alias or key', () => {
    expect(() => setAlias({}, '', 'DATABASE_URL')).toThrow();
    expect(() => setAlias({}, 'db', '')).toThrow();
  });
});

describe('removeAlias', () => {
  it('removes an existing alias', () => {
    const result = removeAlias({ db: 'DATABASE_URL' }, 'db');
    expect(result).toEqual({});
  });

  it('throws when alias does not exist', () => {
    expect(() => removeAlias({}, 'missing')).toThrow('Alias "missing" not found.');
  });
});

describe('resolveAlias', () => {
  it('resolves known alias to its key', () => {
    expect(resolveAlias({ db: 'DATABASE_URL' }, 'db')).toBe('DATABASE_URL');
  });

  it('returns the input unchanged when not an alias', () => {
    expect(resolveAlias({ db: 'DATABASE_URL' }, 'API_KEY')).toBe('API_KEY');
  });
});

describe('formatAliasList', () => {
  it('returns a message when no aliases exist', () => {
    expect(formatAliasList({})).toBe('No aliases defined.');
  });

  it('formats aliases as arrow notation', () => {
    const output = formatAliasList({ db: 'DATABASE_URL' });
    expect(output).toContain('db -> DATABASE_URL');
  });
});
