import { z } from 'zod';
import { SchemaZ, DialectZ } from '../../schema/schema.types.js';

export const CreateSavedSchemaDtoZ = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  dialect: DialectZ,
  schema: SchemaZ,
});

export type CreateSavedSchemaDto = z.infer<typeof CreateSavedSchemaDtoZ>;
