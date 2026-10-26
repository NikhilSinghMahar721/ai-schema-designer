import { z } from 'zod';

// ── Column types (logical) ────────────────────────────────────────────
export const COLUMN_TYPES = [
  'INTEGER',
  'BIGINT',
  'VARCHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'DECIMAL',
  'UUID',
] as const;

export const ColumnTypeZ = z.enum(COLUMN_TYPES);
export type ColumnType = z.infer<typeof ColumnTypeZ>;

// ── Identifier pattern ────────────────────────────────────────────────
const NAME_RE = /^[a-z_][a-z0-9_]{0,62}$/;

// ── Column ────────────────────────────────────────────────────────────
export const ColumnZ = z.object({
  id: z.string().min(1),
  name: z.string().regex(NAME_RE, 'Column name must match /^[a-z_][a-z0-9_]{0,62}$/'),
  type: ColumnTypeZ,
  length: z.number().int().min(1).max(1000).optional(),
  precision: z.number().int().min(1).max(1000).optional(),
  scale: z.number().int().min(0).max(1000).optional(),
  primaryKey: z.boolean(),
  nullable: z.boolean(),
  unique: z.boolean(),
  autoIncrement: z.boolean().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});
export type Column = z.infer<typeof ColumnZ>;

// ── Table ─────────────────────────────────────────────────────────────
export const TableZ = z.object({
  id: z.string().min(1),
  name: z.string().regex(NAME_RE, 'Table name must match /^[a-z_][a-z0-9_]{0,62}$/'),
  columns: z.array(ColumnZ).min(1).max(50),
});
export type Table = z.infer<typeof TableZ>;

// ── On-delete actions ─────────────────────────────────────────────────
export const ON_DELETE_ACTIONS = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as const;

export const OnDeleteZ = z.enum(ON_DELETE_ACTIONS);
export type OnDeleteAction = z.infer<typeof OnDeleteZ>;

// ── Relationship ──────────────────────────────────────────────────────
export const RelationshipZ = z.object({
  id: z.string().min(1),
  fromTable: z.string().min(1),
  fromColumn: z.string().min(1),
  toTable: z.string().min(1),
  toColumn: z.string().min(1),
  onDelete: OnDeleteZ,
});
export type Relationship = z.infer<typeof RelationshipZ>;

// ── Schema (top level) ───────────────────────────────────────────────
export const SchemaZ = z.object({
  tables: z.array(TableZ).min(1).max(30),
  relationships: z.array(RelationshipZ).max(100),
});
export type Schema = z.infer<typeof SchemaZ>;

// ── SQL dialects ─────────────────────────────────────────────────────
export const DIALECTS = ['postgresql', 'mysql'] as const;
export const DialectZ = z.enum(DIALECTS);
export type Dialect = z.infer<typeof DialectZ>;
