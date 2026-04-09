import { encrypt, decrypt, deriveKey } from './encryption';
import crypto from 'crypto';

describe('deriveKey', () => {
  it('produces a 32-byte key', () => {
    const salt = crypto.randomBytes(32);
    const key = deriveKey('secret', salt);
    expect(key.length).toBe(32);
  });

  it('produces the same key for same inputs', () => {
    const salt = crypto.randomBytes(32);
    const key1 = deriveKey('secret', salt);
    const key2 = deriveKey('secret', salt);
    expect(key1.equals(key2)).toBe(true);
  });
});

describe('encrypt / decrypt', () => {
  const password = 'super-secret-password';
  const plaintext = 'DATABASE_URL=postgres://localhost/mydb';

  it('encrypts and decrypts successfully', () => {
    const payload = encrypt(plaintext, password);
    const result = decrypt(payload, password);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertext on each call', () => {
    const p1 = encrypt(plaintext, password);
    const p2 = encrypt(plaintext, password);
    expect(p1.data).not.toBe(p2.data);
  });

  it('throws on wrong password', () => {
    const payload = encrypt(plaintext, password);
    expect(() => decrypt(payload, 'wrong-password')).toThrow();
  });

  it('throws on tampered data', () => {
    const payload = encrypt(plaintext, password);
    payload.data = payload.data.slice(0, -2) + 'ff';
    expect(() => decrypt(payload, password)).toThrow();
  });
});
