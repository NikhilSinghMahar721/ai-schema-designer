import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/config/env.validation.js';

describe('validateEnv', () => {
  const baseValid = {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-2.5-flash',
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
    JWT_SECRET: 'this_is_a_valid_secret_that_has_at_least_32_characters_ok',
  };

  it('validates a correct environment config with defaults', () => {
    const config = validateEnv(baseValid);
    expect(config.GEMINI_API_KEY).toBe('test-key');
    expect(config.DATABASE_URL).toBe(baseValid.DATABASE_URL);
    expect(config.JWT_SECRET).toBe(baseValid.JWT_SECRET);
    expect(config.JWT_EXPIRES_IN).toBe('1h');
    expect(config.PORT).toBe(4000);
    expect(config.COOKIE_SECURE).toBe(false);
    expect(config.AUTH_RATE_LIMIT_MAX).toBe(10);
  });

  it('rejects missing or empty DATABASE_URL', () => {
    const missing = { ...baseValid };
    delete (missing as Record<string, unknown>).DATABASE_URL;
    expect(() => validateEnv(missing)).toThrow('DATABASE_URL');

    const empty = { ...baseValid, DATABASE_URL: '' };
    expect(() => validateEnv(empty)).toThrow('DATABASE_URL is required');
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    const invalid = {
      ...baseValid,
      JWT_SECRET: 'too_short_secret',
    };

    expect(() => validateEnv(invalid)).toThrow(
      'JWT_SECRET must be at least 32 characters',
    );
  });

  it('parses COOKIE_SECURE true when set', () => {
    const config = validateEnv({
      ...baseValid,
      COOKIE_SECURE: 'true',
    });
    expect(config.COOKIE_SECURE).toBe(true);
  });
});
