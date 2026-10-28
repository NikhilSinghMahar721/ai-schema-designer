/**
 * Password utility using Argon2id.
 * This is the ONLY file in the entire application that hashes or verifies passwords.
 * Passwords are never logged or stored in plain text.
 */
import argon2 from 'argon2';

/**
 * Pre-computed valid argon2id hash of a dummy password.
 * Used for constant-time comparison when a user email is not found during login (V21).
 */
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$1eM+vK+7E2yE7V9GZ+6J1A$uXhR6H6wWd4u1Vp9N9yT3q7L2sK8j5O0zX4bV1c3mE0';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
  });
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
