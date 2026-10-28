import { z } from 'zod';

export const LoginDtoZ = z.strictObject({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type LoginDto = z.infer<typeof LoginDtoZ>;
