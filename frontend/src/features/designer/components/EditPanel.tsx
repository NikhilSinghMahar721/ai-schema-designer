'use client';

/**
 * EditPanel.tsx — Interactive schema inspector and editor.
 * Provides controls to rename tables, edit column properties (types, PK, UQ, NN, AI),
 * adjust foreign key relationships (onDelete), and view real-time validation warnings.
 */

import React from 'react';
import {
  COLUMN_TYPES,
  ON_DELETE_ACTIONS,
  type ColumnType,
  type OnDeleteAction,
} from '../types';
import { useSchemaStore } from '../store/schema.store';
import { isValidName, isReservedWord } from '../../../lib/schemaValidator';

export function EditPanel() {
  const {
    schema,
    selectedTableId,
    selectedColumnId,
    selectedRelationshipId,
    validationErrors,
    updateTableName,
    deleteTable,
    addColumn,
    updateColumn,
    deleteColumn,
    updateRelationship,
    deleteRelationship,
    clearSelection,
    addTable,
  } = useSchemaStore();

  const selectedTable = schema.tables.find((t) => t.id === selectedTableId);
  const selectedColumn = selectedTable?.columns.find(
    (c) => c.id === selectedColumnId,
  );
  const selectedRel = schema.relationships.find(
    (r) => r.id === selectedRelationshipId,
  );

  // If nothing is selected, show schema overview & add table
  if (!selectedTable && !selectedRel) {
    return (
      <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800 text-xs">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
            Inspector & Properties
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            Overview
          </span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <h4 className="font-semibold text-zinc-200 mb-1">Select an Element</h4>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Click on any table card, column row, or relationship line in the
              diagram canvas to edit properties, constraints, and keys.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addTable()}
              className="flex-1 py-2 px-3 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Table</span>
            </button>
          </div>

          {/* Validation Warnings Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 font-medium">Schema Health</span>
              {validationErrors.length === 0 ? (
                <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  All rules pass
                </span>
              ) : (
                <span className="text-amber-400 text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {validationErrors.length}{' '}
                  {validationErrors.length === 1 ? 'issue' : 'issues'}
                </span>
              )}
            </div>

            {validationErrors.length > 0 ? (
              <div className="rounded-lg bg-amber-950/20 border border-amber-900/40 p-3 space-y-1.5 max-h-56 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <div key={i} className="text-[11px] text-amber-200 flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="leading-tight">{err}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-[11px] text-zinc-400">
                <span className="text-emerald-400 mr-1.5">✓</span>
                Schema structure and constraints adhere to all PostgreSQL and MySQL generation requirements.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Relationship Inspector
  if (selectedRel) {
    const fromT = schema.tables.find((t) => t.id === selectedRel.fromTable);
    const fromC = fromT?.columns.find((c) => c.id === selectedRel.fromColumn);
    const toT = schema.tables.find((t) => t.id === selectedRel.toTable);
    const toC = toT?.columns.find((c) => c.id === selectedRel.toColumn);

    return (
      <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800 text-xs">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="font-semibold text-zinc-100">
              Foreign Key Relation
            </span>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono">
                Source (Holding FK)
              </span>
              <p className="font-mono font-medium text-zinc-200">
                {fromT?.name ?? selectedRel.fromTable}.{fromC?.name ?? selectedRel.fromColumn}
              </p>
            </div>
            <div className="text-center text-zinc-500 font-mono text-[10px]">↓ References</div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono">
                Target (Primary / Unique)
              </span>
              <p className="font-mono font-medium text-blue-400">
                {toT?.name ?? selectedRel.toTable}.{toC?.name ?? selectedRel.toColumn}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              ON DELETE Behavior
            </label>
            <select
              value={selectedRel.onDelete}
              onChange={(e) =>
                updateRelationship(selectedRel.id, {
                  onDelete: e.target.value as OnDeleteAction,
                })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-xs"
            >
              {ON_DELETE_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">
              Specifies referential action when the referenced row is deleted.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => deleteRelationship(selectedRel.id)}
              className="w-full py-2 px-3 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 font-medium transition-colors"
            >
              Delete Relationship
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Table / Column Inspector
  return (
    <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800 text-xs">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 3.5 3 8 3s8-1 8-3V7M4 7c0 2 3.5 3 8 3s8-1 8-3M4 7c0-2 3.5-3 8-3s8 1 8 3m0 5c0 2-3.5 3-8 3s-8-1-8-3" />
          </svg>
          <span className="font-semibold text-zinc-100 font-mono">
            {selectedTable?.name}
          </span>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="text-zinc-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Table Rename */}
        <div>
          <label className="block text-zinc-300 font-medium mb-1">
            Table Name
          </label>
          <input
            type="text"
            value={selectedTable?.name || ''}
            onChange={(e) => {
              if (selectedTable) {
                updateTableName(selectedTable.id, e.target.value.toLowerCase().trim());
              }
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
          {selectedTable && !isValidName(selectedTable.name) && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono">
              Must match /^[a-z_][a-z0-9_]{'{0,62}'}$/
            </p>
          )}
          {selectedTable && isReservedWord(selectedTable.name) && (
            <p className="text-[10px] text-rose-400 mt-1">
              &quot;{selectedTable.name}&quot; is a SQL reserved word.
            </p>
          )}
        </div>

        {/* Selected Column Editor */}
        {selectedColumn ? (
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 font-mono text-xs">
                Column: {selectedColumn.name}
              </span>
              <button
                type="button"
                onClick={() =>
                  selectedTable &&
                  deleteColumn(selectedTable.id, selectedColumn.id)
                }
                className="text-rose-400 hover:text-rose-300 text-[11px]"
              >
                Delete
              </button>
            </div>

            {/* Column Name */}
            <div>
              <label className="block text-zinc-400 text-[10px] uppercase font-mono mb-1">
                Name
              </label>
              <input
                type="text"
                value={selectedColumn.name}
                onChange={(e) => {
                  if (selectedTable) {
                    updateColumn(selectedTable.id, selectedColumn.id, {
                      name: e.target.value.toLowerCase().trim(),
                    });
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Data Type */}
            <div>
              <label className="block text-zinc-400 text-[10px] uppercase font-mono mb-1">
                Data Type
              </label>
              <select
                value={selectedColumn.type}
                onChange={(e) => {
                  if (selectedTable) {
                    updateColumn(selectedTable.id, selectedColumn.id, {
                      type: e.target.value as ColumnType,
                    });
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Specific Fields */}
            {selectedColumn.type === 'VARCHAR' && (
              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-mono mb-1">
                  Length (1–1000)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={selectedColumn.length ?? 255}
                  onChange={(e) => {
                    if (selectedTable) {
                      updateColumn(selectedTable.id, selectedColumn.id, {
                        length: parseInt(e.target.value, 10) || undefined,
                      });
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            )}

            {selectedColumn.type === 'DECIMAL' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-[10px] uppercase font-mono mb-1">
                    Precision
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={selectedColumn.precision ?? 10}
                    onChange={(e) => {
                      if (selectedTable) {
                        updateColumn(selectedTable.id, selectedColumn.id, {
                          precision: parseInt(e.target.value, 10) || undefined,
                        });
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[10px] uppercase font-mono mb-1">
                    Scale
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={selectedColumn.scale ?? 2}
                    onChange={(e) => {
                      if (selectedTable) {
                        updateColumn(selectedTable.id, selectedColumn.id, {
                          scale: parseInt(e.target.value, 10) || 0,
                        });
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            )}

            {/* Checkbox Constraints */}
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={selectedColumn.primaryKey}
                  onChange={(e) => {
                    if (selectedTable) {
                      const isPk = e.target.checked;
                      updateColumn(selectedTable.id, selectedColumn.id, {
                        primaryKey: isPk,
                        nullable: isPk ? false : selectedColumn.nullable,
                        unique: isPk ? true : selectedColumn.unique,
                      });
                    }
                  }}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span>Primary Key (PK)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={selectedColumn.nullable}
                  disabled={selectedColumn.primaryKey}
                  onChange={(e) => {
                    if (selectedTable) {
                      updateColumn(selectedTable.id, selectedColumn.id, {
                        nullable: e.target.checked,
                      });
                    }
                  }}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-50"
                />
                <span>Nullable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={selectedColumn.unique}
                  disabled={selectedColumn.primaryKey}
                  onChange={(e) => {
                    if (selectedTable) {
                      updateColumn(selectedTable.id, selectedColumn.id, {
                        unique: e.target.checked,
                      });
                    }
                  }}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-50"
                />
                <span>Unique (UQ)</span>
              </label>

              {(selectedColumn.type === 'INTEGER' ||
                selectedColumn.type === 'BIGINT') &&
                selectedColumn.primaryKey && (
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={!!selectedColumn.autoIncrement}
                      onChange={(e) => {
                        if (selectedTable) {
                          updateColumn(selectedTable.id, selectedColumn.id, {
                            autoIncrement: e.target.checked,
                          });
                        }
                      }}
                      className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                    />
                    <span>Auto Increment</span>
                  </label>
                )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-center text-[11px]">
            Click any column in this table to edit its types and constraints.
          </div>
        )}

        {/* Table Level Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => selectedTable && addColumn(selectedTable.id)}
            className="w-full py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-medium transition-colors"
          >
            + Add Column to Table
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                selectedTable &&
                window.confirm(
                  `Are you sure you want to delete table "${selectedTable.name}"?`,
                )
              ) {
                deleteTable(selectedTable.id);
              }
            }}
            className="w-full py-2 px-3 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 font-medium transition-colors"
          >
            Delete Table
          </button>
        </div>
      </div>
    </div>
  );
}
