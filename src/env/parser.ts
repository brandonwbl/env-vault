/**
 * Parses and serializes .env file content
 */

export interface EnvMap {
  [key: string]: string;
}

/**
 * Parse a .env file string into a key-value map.
 * Supports comments, quoted values, and blank lines.
 */
export function parseEnv(content: string): EnvMap {
  const result: EnvMap = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    // Skip blank lines and comments
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip inline comments (only outside quotes)
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx).trim();
      }
    }

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialize a key-value map back into .env file format.
 */
export function serializeEnv(env: EnvMap): string {
  return Object.entries(env)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuotes = /[\s#"'\\]/.test(value);
      const serializedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${serializedValue}`;
    })
    .join('\n');
}
