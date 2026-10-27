'use client';

/**
 * TableNode.tsx — Custom React Flow node rendering an interactive SQL table card.
 * Includes column handles for foreign-key connection dragging, key badges,
 * and quick actions (add column, edit, delete).
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Table, Column } from '../types';
import { useSchemaStore } from '../store/schema.store';

export interface TableNodeData {
  table: Table;
  [key: string]: unknown;
}

export const TableNode = memo(function TableNode({
  data,
  selected,
}: NodeProps) {
  const table = data.table as Table;
  const {
    schema,
    selectedTableId,
    selectedColumnId,
    setSelectedTable,
    setSelectedColumn,
    deleteTable,
    addColumn,
    deleteColumn,
  } = useSchemaStore();

  const isTableSelected = selected || selectedTableId === table.id;

  // Set of column IDs that participate in relationships
  const outboundColIds = new Set(
    schema.relationships
      .filter((r) => r.fromTable === table.id)
      .map((r) => r.fromColumn),
  );
  const inboundColIds = new Set(
    schema.relationships
      .filter((r) => r.toTable === table.id)
      .map((r) => r.toColumn),
  );

  return (
    <div
      className={`w-72 rounded-xl border bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-150 overflow-hidden text-xs ${
        isTableSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedTable(table.id);
      }}
    >
      {/* Table Card Header (Draggable) */}
      <div className="table-drag-handle cursor-grab active:cursor-grabbing bg-slate-800/80 border-b border-slate-700/80 px-3.5 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-indigo-400 font-bold text-sm">🗄️</span>
          <span
            className="font-bold text-slate-100 font-mono text-xs truncate max-w-[130px]"
            title={table.name}
          >
            {table.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            {table.columns.length}
          </span>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Add column"
            onClick={(e) => {
              e.stopPropagation();
              addColumn(table.id);
            }}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            type="button"
            title="Delete table"
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm(
                  `Are you sure you want to delete table "${table.name}"?`,
                )
              ) {
                deleteTable(table.id);
              }
            }}
            className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-800/60 py-1 max-h-[360px] overflow-y-auto">
        {table.columns.map((col: Column) => {
          const isColSelected =
            selectedTableId === table.id && selectedColumnId === col.id;
          const isOutboundFk = outboundColIds.has(col.id);
          const isInboundTarget = inboundColIds.has(col.id);

          return (
            <div
              key={col.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColumn(table.id, col.id);
              }}
              className={`group relative px-3 py-1.5 flex items-center justify-between transition-colors cursor-pointer ${
                isColSelected
                  ? 'bg-indigo-950/70 text-white'
                  : 'hover:bg-slate-800/50 text-slate-200'
              }`}
            >
              {/* React Flow Left Handle (Target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={col.id}
                className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900 group-hover:!scale-125 !transition-transform !-left-1.5"
                title={`Target handle for ${table.name}.${col.name}`}
              />

              {/* Column Name & Key Badges */}
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                {col.primaryKey ? (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60 shrink-0"
                    title="Primary Key"
                  >
                    PK
                  </span>
                ) : isOutboundFk ? (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 shrink-0"
                    title="Foreign Key (references another table)"
                  >
                    FK
                  </span>
                ) : isInboundTarget ? (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 shrink-0"
                    title="Referenced by Foreign Key"
                  >
                    REF
                  </span>
                ) : col.unique ? (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50 shrink-0"
                    title="Unique"
                  >
                    UQ
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 ml-1" />
                )}

                <span
                  className={`font-mono text-xs truncate ${
                    col.primaryKey
                      ? 'text-amber-200 font-semibold'
                      : 'text-slate-200'
                  }`}
                  title={col.name}
                >
                  {col.name}
                </span>
              </div>

              {/* Column Type & Modifiers */}
              <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono text-slate-400">
                <span className="text-indigo-300 text-[10px]">
                  {col.type}
                  {col.length ? `(${col.length})` : ''}
                  {col.precision ? `(${col.precision},${col.scale ?? 0})` : ''}
                </span>

                {!col.nullable && (
                  <span
                    className="text-[8px] text-slate-400 px-1 py-0.2 rounded bg-slate-800 border border-slate-700"
                    title="NOT NULL"
                  >
                    NN
                  </span>
                )}

                {col.autoIncrement && (
                  <span
                    className="text-[8px] text-amber-400 px-1 py-0.2 rounded bg-amber-950/80 border border-amber-800"
                    title="Auto Increment"
                  >
                    AI
                  </span>
                )}

                {/* Delete Column Quick Button (shown on hover if >1 col) */}
                {table.columns.length > 1 && (
                  <button
                    type="button"
                    title="Delete column"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteColumn(table.id, col.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* React Flow Right Handle (Source) */}
              <Handle
                type="source"
                position={Position.Right}
                id={col.id}
                className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900 group-hover:!scale-125 !transition-transform !-right-1.5"
                title={`Source handle for ${table.name}.${col.name}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
