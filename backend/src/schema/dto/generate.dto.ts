import { z } from 'zod';
import { DialectZ } from '../schema.types.js';

export const GenerateDtoZ = z.strictObject({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be at most 2000 characters'),
  dialect: DialectZ.default('postgresql'),
});

export type GenerateDto = z.infer<typeof GenerateDtoZ>;
