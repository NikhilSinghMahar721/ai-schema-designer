/**
 * Zod validation for environment variables.
 * The app will refuse to start if required variables are missing or invalid.
 * Account-related variables (DATABASE_URL, JWT_SECRET, etc.) are optional
 * during Phases 0–7 and become required starting at Phase 8.
 */

import { z } from 'zod';

export const EnvSchema = z.object({
  // AI provider
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1, 'GEMINI_MODEL is required'),

  // Server
  PORT: z
    .string()
    .default('4000')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(65535)),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),

  // Rate limiting
  RATE_LIMIT_TTL_SECONDS: z
    .string()
    .default('60')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),
  RATE_LIMIT_MAX: z
    .string()
    .default('30')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),

  // Account & database configuration (Phase 8+)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  AUTH_RATE_LIMIT_MAX: z
    .string()
    .default('10')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Validates process.env and returns a typed config object.
 * Throws with a descriptive error if validation fails.
 */
export function validateEnv(config?: Record<string, unknown>): EnvConfig {
  const toValidate =
    config && Object.keys(config).length > 0 ? config : process.env;
  const result = EnvSchema.safeParse(toValidate);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}
