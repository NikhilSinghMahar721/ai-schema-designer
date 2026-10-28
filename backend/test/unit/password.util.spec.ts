import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
} from '../../src/auth/password.util.js';

describe('password.util', () => {
  const plainPassword = 'superSecretPassword123!';

  it('hashes password to an argon2id format string, not plain text', async () => {
    const hash = await hashPassword(plainPassword);

    expect(hash).not.toBe(plainPassword);
    expect(hash).toMatch(/^\$argon2id\$v=19\$/);
  });

  it('generates unique salts on successive hashes of identical password', async () => {
    const hash1 = await hashPassword(plainPassword);
    const hash2 = await hashPassword(plainPassword);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(hash1, plainPassword)).toBe(true);
    expect(await verifyPassword(hash2, plainPassword)).toBe(true);
  });

  it('verifies correctly with matching password', async () => {
    const hash = await hashPassword(plainPassword);
    const valid = await verifyPassword(hash, plainPassword);
    expect(valid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword(plainPassword);
    const valid = await verifyPassword(hash, 'wrongPassword123!');
    expect(valid).toBe(false);
  });

  it('handles invalid or corrupted hash gracefully without crashing', async () => {
    const valid = await verifyPassword('not-a-valid-argon-hash', plainPassword);
    expect(valid).toBe(false);
  });

  it('dummy hash verification works and returns false for random password', async () => {
    const valid = await verifyPassword(DUMMY_PASSWORD_HASH, 'randomAttempt123');
    expect(valid).toBe(false);
  });
});
