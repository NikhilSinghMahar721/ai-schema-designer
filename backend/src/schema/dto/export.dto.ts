import { z } from 'zod';
import { SchemaZ, DialectZ } from '../schema.types.js';

export const ExportDtoZ = z.object({
  schema: SchemaZ,
  dialect: DialectZ,
});

export type ExportDto = z.infer<typeof ExportDtoZ>;
