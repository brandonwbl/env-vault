import { parseEnv, serializeEnv, EnvMap } from './parser';

describe('parseEnv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores blank lines and comments', () => {
    const input = `
# This is a comment
FOO=bar

# Another comment
BAZ=qux
`;
    expect(parseEnv(input)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('strips double-quoted values', () => {
    expect(parseEnv('FOO="hello world"')).toEqual({ FOO: 'hello world' });
  });

  it('strips single-quoted values', () => {
    expect(parseEnv("FOO='hello world'")).toEqual({ FOO: 'hello world' });
  });

  it('strips inline comments from unquoted values', () => {
    expect(parseEnv('FOO=bar # inline comment')).toEqual({ FOO: 'bar' });
  });

  it('does not strip inline comments from quoted values', () => {
    expect(parseEnv('FOO="bar # not a comment"')).toEqual({
      FOO: 'bar # not a comment',
    });
  });

  it('handles values with equals signs', () => {
    expect(parseEnv('FOO=a=b=c')).toEqual({ FOO: 'a=b=c' });
  });

  it('skips lines without an equals sign', () => {
    expect(parseEnv('INVALID_LINE')).toEqual({});
  });
});

describe('serializeEnv', () => {
  it('serializes a simple map to env format', () => {
    const env: EnvMap = { FOO: 'bar', BAZ: 'qux' };
    const result = serializeEnv(env);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    expect(serializeEnv({ FOO: 'hello world' })).toBe('FOO="hello world"');
  });

  it('quotes values with hash characters', () => {
    expect(serializeEnv({ FOO: 'bar#baz' })).toBe('FOO="bar#baz"');
  });

  it('round-trips through parse and serialize', () => {
    const original: EnvMap = { API_KEY: 'abc123', DB_URL: 'localhost:5432' };
    const serialized = serializeEnv(original);
    const parsed = parseEnv(serialized);
    expect(parsed).toEqual(original);
  });
});
