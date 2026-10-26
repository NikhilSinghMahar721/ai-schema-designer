import { z } from 'zod';
import { SchemaZ } from '../schema.types.js';

export const RefineDtoZ = z.object({
  schema: SchemaZ,
  instruction: z
    .string()
    .min(1, 'Instruction is required')
    .max(500, 'Instruction must be at most 500 characters'),
});

export type RefineDto = z.infer<typeof RefineDtoZ>;
