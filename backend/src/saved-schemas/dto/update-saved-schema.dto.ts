import { z } from 'zod';
import { SchemaZ, DialectZ } from '../../schema/schema.types.js';

export const UpdateSavedSchemaDtoZ = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    dialect: DialectZ.optional(),
    schema: SchemaZ.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.dialect !== undefined ||
      data.schema !== undefined,
    'At least one field (name, dialect, or schema) must be provided for update',
  );

export type UpdateSavedSchemaDto = z.infer<typeof UpdateSavedSchemaDtoZ>;
