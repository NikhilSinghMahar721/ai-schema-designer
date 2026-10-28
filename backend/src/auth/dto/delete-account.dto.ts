import { z } from 'zod';

export const DeleteAccountDtoZ = z.strictObject({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters'),
});

export type DeleteAccountDto = z.infer<typeof DeleteAccountDtoZ>;
