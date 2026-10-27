/**
 * Prompt templates for the "refine" flow.
 * Sends the current schema + a user instruction to the model.
 */

import { COLUMN_TYPES } from '../../schema/schema.types.js';
import type { Schema } from '../../schema/schema.types.js';

const SYSTEM_PROMPT = `You are a database schema designer. You will receive an existing database schema as JSON and a user instruction describing how to modify it. Return the UPDATED schema as JSON.

RULES — follow every one precisely:
1. Return ONLY valid JSON. No prose, no markdown, no code fences, no explanation.
2. The JSON must match the same shape as the input schema (tables array + relationships array). See the schema structure in the input.
3. Allowed column types: ${COLUMN_TYPES.join(', ')}
4. Table and column names: lowercase letters, digits, and underscores only. Must start with a letter or underscore. Max 63 characters. Must not be SQL reserved words.
5. Every table MUST have at least one primary key column.
6. IDs must be unique across the entire schema:
   - Table ids: "t_<table_name>"
   - Column ids: "c_<table_name>_<column_name>"
   - Relationship ids: "r_1", "r_2", etc.
7. Foreign key columns must have the same type as the referenced column. The referenced column must be a primary key or unique.
8. "autoIncrement" may only be true on INTEGER or BIGINT columns that are also primary keys.
9. "length" may only appear on VARCHAR columns. "precision" and "scale" may only appear on DECIMAL columns.
10. Limits: max 30 tables, max 50 columns per table, max 100 relationships.
11. Preserve existing tables and columns unless the instruction says to change or remove them. Keep all existing IDs stable unless a rename changes the name component.
12. When adding new tables/columns, generate proper IDs following the naming convention.`;

/**
 * Builds the full prompt messages for schema refinement.
 */
export function buildRefinePrompt(
  schema: Schema,
  instruction: string,
): {
  systemInstruction: string;
  userMessage: string;
} {
  return {
    systemInstruction: SYSTEM_PROMPT,
    userMessage: `Current schema:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\nInstruction:\n---\n${instruction}\n---\n\nReturn the updated schema as JSON.`,
  };
}
