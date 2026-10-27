/**
 * Frontend schema and designer types.
 * Matches backend schema contract defined in requirements.md §6.
 */

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

export type ColumnType = (typeof COLUMN_TYPES)[number];

export interface Column {
  id: string; // "c_<table>_<name>"
  name: string;
  type: ColumnType;
  primaryKey: boolean;
  nullable: boolean;
  unique: boolean;
  autoIncrement?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: string | number | boolean | null;
}

export interface Table {
  id: string; // "t_<table>"
  name: string;
  columns: Column[];
}

export const ON_DELETE_ACTIONS = [
  'CASCADE',
  'SET NULL',
  'RESTRICT',
  'NO ACTION',
] as const;

export type OnDeleteAction = (typeof ON_DELETE_ACTIONS)[number];

export interface Relationship {
  id: string; // "r_<number>"
  fromTable: string; // table id
  fromColumn: string; // column id
  toTable: string; // table id
  toColumn: string; // column id
  onDelete: OnDeleteAction;
}

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export type Dialect = 'postgresql' | 'mysql';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
