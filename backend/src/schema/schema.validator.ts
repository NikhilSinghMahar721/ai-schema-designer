/**
 * Semantic validation rules for a parsed Schema.
 * These go beyond Zod's structural checks to enforce business rules
 * from requirements.md §6.
 */

import type { Schema, Column } from './schema.types.js';
import { isReservedWord } from '../sql/identifier.util.js';

export class SchemaValidationError extends Error {
  constructor(
    public readonly errors: string[],
  ) {
    super(`Schema validation failed:\n${errors.join('\n')}`);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Runs all semantic rules against a structurally-valid Schema.
 * Throws SchemaValidationError if any rule fails.
 */
export function validateSemantics(schema: Schema): void {
  const errors: string[] = [];

  // Rule 1: Table names must be unique
  const tableNames = new Set<string>();
  const tableIdMap = new Map<string, string>(); // id → name
  const columnIdMap = new Map<string, { tableName: string; column: Column }>();

  for (const table of schema.tables) {
    if (tableNames.has(table.name)) {
      errors.push(`Duplicate table name: "${table.name}"`);
    }
    tableNames.add(table.name);

    if (tableIdMap.has(table.id)) {
      errors.push(`Duplicate table id: "${table.id}"`);
    }
    tableIdMap.set(table.id, table.name);

    // Rule 8: Table name is not a reserved word
    if (isReservedWord(table.name)) {
      errors.push(`Table name "${table.name}" is a SQL reserved word`);
    }

    // Rule 1 (columns): Column names must be unique within a table
    const colNames = new Set<string>();
    const colIds = new Set<string>();
    let hasPK = false;

    for (const col of table.columns) {
      if (colNames.has(col.name)) {
        errors.push(`Duplicate column name "${col.name}" in table "${table.name}"`);
      }
      colNames.add(col.name);

      if (colIds.has(col.id)) {
        errors.push(`Duplicate column id "${col.id}" in table "${table.name}"`);
      }
      colIds.add(col.id);

      if (columnIdMap.has(col.id)) {
        errors.push(`Column id "${col.id}" is used in multiple tables`);
      }
      columnIdMap.set(col.id, { tableName: table.name, column: col });

      if (col.primaryKey) {
        hasPK = true;
      }

      // Rule 8: Column name is not a reserved word
      if (isReservedWord(col.name)) {
        errors.push(`Column name "${col.name}" in table "${table.name}" is a SQL reserved word`);
      }

      // Rule 6: length only on VARCHAR
      if (col.length !== undefined && col.type !== 'VARCHAR') {
        errors.push(`Column "${col.name}" in table "${table.name}": "length" is only allowed for VARCHAR`);
      }

      // Rule 6: precision/scale only on DECIMAL
      if (col.precision !== undefined && col.type !== 'DECIMAL') {
        errors.push(`Column "${col.name}" in table "${table.name}": "precision" is only allowed for DECIMAL`);
      }
      if (col.scale !== undefined && col.type !== 'DECIMAL') {
        errors.push(`Column "${col.name}" in table "${table.name}": "scale" is only allowed for DECIMAL`);
      }

      // Rule 7: autoIncrement only on integer primary keys
      if (col.autoIncrement) {
        if (!col.primaryKey) {
          errors.push(`Column "${col.name}" in table "${table.name}": autoIncrement requires primaryKey`);
        }
        if (col.type !== 'INTEGER' && col.type !== 'BIGINT') {
          errors.push(`Column "${col.name}" in table "${table.name}": autoIncrement only on INTEGER/BIGINT`);
        }
      }
    }

    // Rule 2: Every table must have at least one PK column
    if (!hasPK) {
      errors.push(`Table "${table.name}" has no primary key column`);
    }
  }

  // Rules 3, 4, 5: Relationship validation
  for (const rel of schema.relationships) {
    // Rule 3: fromTable and toTable must reference existing table ids
    const fromTableName = tableIdMap.get(rel.fromTable);
    const toTableName = tableIdMap.get(rel.toTable);

    if (!fromTableName) {
      errors.push(`Relationship "${rel.id}": fromTable "${rel.fromTable}" does not reference an existing table id`);
    }
    if (!toTableName) {
      errors.push(`Relationship "${rel.id}": toTable "${rel.toTable}" does not reference an existing table id`);
    }

    // Rule 3: fromColumn and toColumn must reference existing column ids
    const fromCol = columnIdMap.get(rel.fromColumn);
    const toCol = columnIdMap.get(rel.toColumn);

    if (!fromCol) {
      errors.push(`Relationship "${rel.id}": fromColumn "${rel.fromColumn}" does not reference an existing column id`);
    } else if (fromTableName && fromCol.tableName !== fromTableName) {
      errors.push(`Relationship "${rel.id}": fromColumn "${rel.fromColumn}" is not in fromTable "${rel.fromTable}"`);
    }

    if (!toCol) {
      errors.push(`Relationship "${rel.id}": toColumn "${rel.toColumn}" does not reference an existing column id`);
    } else if (toTableName && toCol.tableName !== toTableName) {
      errors.push(`Relationship "${rel.id}": toColumn "${rel.toColumn}" is not in toTable "${rel.toTable}"`);
    }

    // Rule 4: Referenced column (toColumn) must be primary key or unique
    if (toCol && !(toCol.column.primaryKey || toCol.column.unique)) {
      errors.push(`Relationship "${rel.id}": toColumn "${rel.toColumn}" must be a primary key or unique column`);
    }

    // Rule 5: FK column type must be compatible with referenced column type
    if (fromCol && toCol) {
      if (!areTypesCompatible(fromCol.column, toCol.column)) {
        errors.push(
          `Relationship "${rel.id}": type mismatch — fromColumn type "${fromCol.column.type}" is not compatible with toColumn type "${toCol.column.type}"`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new SchemaValidationError(errors);
  }
}

/**
 * Checks if two column types are compatible for a foreign key relationship.
 * Exact match is always compatible. INTEGER ↔ BIGINT are compatible.
 */
function areTypesCompatible(fk: Column, referenced: Column): boolean {
  if (fk.type === referenced.type) return true;

  const integerTypes = new Set(['INTEGER', 'BIGINT']);
  if (integerTypes.has(fk.type) && integerTypes.has(referenced.type)) return true;

  return false;
}
