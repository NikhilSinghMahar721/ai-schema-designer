/**
 * Prompt templates for the "generate" flow.
 * System prompt + user-input builder.
 */

import { COLUMN_TYPES } from '../../schema/schema.types.js';

const SYSTEM_PROMPT = `You are a database schema designer. Given a natural-language description, you produce a JSON object describing the database schema.

RULES — follow every one precisely:
1. Return ONLY valid JSON. No prose, no markdown, no code fences, no explanation.
2. The JSON must match this exact shape:
   {
     "tables": [
       {
         "id": "t_<table_name>",
         "name": "<table_name>",
         "columns": [
           {
             "id": "c_<table_name>_<column_name>",
             "name": "<column_name>",
             "type": "<TYPE>",
             "primaryKey": <bool>,
             "nullable": <bool>,
             "unique": <bool>,
             "autoIncrement": <bool>,          // optional, only on INTEGER/BIGINT primary keys
             "length": <number>,               // optional, only on VARCHAR (1–1000)
             "precision": <number>,            // optional, only on DECIMAL
             "scale": <number>,                // optional, only on DECIMAL
             "defaultValue": <string|number|boolean|null>  // optional, simple literals only
           }
         ]
       }
     ],
     "relationships": [
       {
         "id": "r_<number>",
         "fromTable": "<table_id>",
         "fromColumn": "<column_id>",
         "toTable": "<table_id>",
         "toColumn": "<column_id>",
         "onDelete": "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"
       }
     ]
   }

3. Allowed column types: ${COLUMN_TYPES.join(', ')}
4. Table and column names: lowercase letters, digits, and underscores only. Must start with a letter or underscore. Max 63 characters. Must not be SQL reserved words (e.g., "user", "order", "group", "select", "table" — use plurals or suffixes like "users", "orders", "groups").
5. Every table MUST have at least one primary key column.
6. IDs must be unique across the entire schema:
   - Table ids: "t_<table_name>"
   - Column ids: "c_<table_name>_<column_name>"
   - Relationship ids: "r_1", "r_2", etc.
7. Foreign key columns must have the same type as the referenced column. The referenced column must be a primary key or unique.
8. "autoIncrement" may only be true on INTEGER or BIGINT columns that are also primary keys.
9. "length" may only appear on VARCHAR columns. "precision" and "scale" may only appear on DECIMAL columns.
10. Limits: max 30 tables, max 50 columns per table, max 100 relationships.
11. Make sensible design choices: use appropriate types, add foreign keys for relationships, include created_at/updated_at timestamps where appropriate.`;

/**
 * Builds the full prompt messages for schema generation.
 */
export function buildGeneratePrompt(description: string): {
  systemInstruction: string;
  userMessage: string;
} {
  return {
    systemInstruction: SYSTEM_PROMPT,
    userMessage: `Design a database schema for the following description:\n\n---\n${description}\n---`,
  };
}
