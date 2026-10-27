/**
 * schemaDiff.ts — Computes a human-readable diff between two schemas.
 * Used by RefineBox to display an informative summary of changes after AI refinement.
 */

import type { Schema } from '../features/designer/types';

export interface TableDiff {
  tableName: string;
  addedColumns: string[];
  removedColumns: string[];
  modifiedColumns: {
    columnName: string;
    changes: string[];
  }[];
}

export interface SchemaDiffSummary {
  addedTables: string[];
  removedTables: string[];
  modifiedTables: TableDiff[];
  addedRelationships: number;
  removedRelationships: number;
  hasChanges: boolean;
}

export function computeSchemaDiff(
  oldSchema: Schema,
  newSchema: Schema,
): SchemaDiffSummary {
  const oldTableMap = new Map(oldSchema.tables.map((t) => [t.name, t]));
  const newTableMap = new Map(newSchema.tables.map((t) => [t.name, t]));

  const addedTables: string[] = [];
  const removedTables: string[] = [];
  const modifiedTables: TableDiff[] = [];

  // Check new tables
  for (const [name, newTable] of newTableMap.entries()) {
    const oldTable = oldTableMap.get(name);
    if (!oldTable) {
      addedTables.push(name);
    } else {
      // Check column changes
      const oldColMap = new Map(oldTable.columns.map((c) => [c.name, c]));
      const newColMap = new Map(newTable.columns.map((c) => [c.name, c]));

      const addedColumns: string[] = [];
      const removedColumns: string[] = [];
      const modifiedColumns: { columnName: string; changes: string[] }[] = [];

      for (const [colName, newCol] of newColMap.entries()) {
        const oldCol = oldColMap.get(colName);
        if (!oldCol) {
          addedColumns.push(`${colName} (${newCol.type})`);
        } else {
          const changes: string[] = [];
          if (oldCol.type !== newCol.type) {
            changes.push(`type: ${oldCol.type} → ${newCol.type}`);
          }
          if (oldCol.primaryKey !== newCol.primaryKey) {
            changes.push(newCol.primaryKey ? '+PK' : '-PK');
          }
          if (oldCol.nullable !== newCol.nullable) {
            changes.push(newCol.nullable ? 'nullable' : 'NOT NULL');
          }
          if (oldCol.unique !== newCol.unique) {
            changes.push(newCol.unique ? '+unique' : '-unique');
          }
          if (changes.length > 0) {
            modifiedColumns.push({ columnName: colName, changes });
          }
        }
      }

      for (const colName of oldColMap.keys()) {
        if (!newColMap.has(colName)) {
          removedColumns.push(colName);
        }
      }

      if (
        addedColumns.length > 0 ||
        removedColumns.length > 0 ||
        modifiedColumns.length > 0
      ) {
        modifiedTables.push({
          tableName: name,
          addedColumns,
          removedColumns,
          modifiedColumns,
        });
      }
    }
  }

  // Check removed tables
  for (const name of oldTableMap.keys()) {
    if (!newTableMap.has(name)) {
      removedTables.push(name);
    }
  }

  const addedRelationships = Math.max(
    0,
    newSchema.relationships.length - oldSchema.relationships.length,
  );
  const removedRelationships = Math.max(
    0,
    oldSchema.relationships.length - newSchema.relationships.length,
  );

  const hasChanges =
    addedTables.length > 0 ||
    removedTables.length > 0 ||
    modifiedTables.length > 0 ||
    oldSchema.relationships.length !== newSchema.relationships.length;

  return {
    addedTables,
    removedTables,
    modifiedTables,
    addedRelationships,
    removedRelationships,
    hasChanges,
  };
}
