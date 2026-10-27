'use client';

/**
 * DiagramCanvas — Center workspace rendering the visual ER schema.
 * Displays tables, columns, primary/foreign keys, and relationships.
 * Serves as the interactive foundation ready for React Flow integration in Phase 6.
 */

import React from 'react';
import { useSchemaStore } from '../store/schema.store';

export function DiagramCanvas() {
  const { schema, isGenerating } = useSchemaStore();

  const totalTables = schema.tables.length;
  const totalColumns = schema.tables.reduce(
    (acc, t) => acc + t.columns.length,
    0,
  );
  const totalRelationships = schema.relationships.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Canvas Top Bar */}
      <div className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-indigo-400">📊</span> Schema Diagram Canvas
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
              {totalTables} {totalTables === 1 ? 'Table' : 'Tables'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
              {totalColumns} Columns
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
              {totalRelationships} Relations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Phase 5 UI Preview · Phase 6 React Flow Canvas
          </span>
        </div>
      </div>

      {/* Grid Canvas Background */}
      <div
        className="flex-1 overflow-auto p-8 relative"
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                ✨
              </div>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Synthesizing Relational Model...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Validating structural constraints, data types, and primary-foreign
              key alignments.
            </p>
          </div>
        ) : totalTables === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-4 shadow-xl">
              📐
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Schema Loaded
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Describe your application in the left panel to generate a relational
              schema, or click below to load an example design.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {schema.tables.map((table) => {
              // Find inbound & outbound relationships for this table
              const outboundFks = schema.relationships.filter(
                (r) => r.fromTable === table.id,
              );
              const inboundFks = schema.relationships.filter(
                (r) => r.toTable === table.id,
              );

              return (
                <div
                  key={table.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-xl hover:border-slate-700 transition-all overflow-hidden flex flex-col"
                >
                  {/* Table Header */}
                  <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">
                        {table.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({table.columns.length})
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
                      {table.id}
                    </span>
                  </div>

                  {/* Columns List */}
                  <div className="p-3 divide-y divide-slate-800/50 flex-1">
                    {table.columns.map((col) => (
                      <div
                        key={col.id}
                        className="py-2 px-1 flex items-center justify-between text-xs hover:bg-slate-800/30 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {col.primaryKey ? (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/50"
                              title="Primary Key"
                            >
                              PK
                            </span>
                          ) : col.unique ? (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                              title="Unique"
                            >
                              UQ
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-700 ml-1.5" />
                          )}
                          <span className="font-mono text-slate-200 truncate">
                            {col.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                          <span className="text-indigo-300">
                            {col.type}
                            {col.length ? `(${col.length})` : ''}
                            {col.precision
                              ? `(${col.precision},${col.scale ?? 0})`
                              : ''}
                          </span>
                          {!col.nullable && (
                            <span
                              className="text-[9px] text-slate-400 px-1 py-0.2 rounded bg-slate-800/70"
                              title="NOT NULL"
                            >
                              NN
                            </span>
                          )}
                          {col.autoIncrement && (
                            <span
                              className="text-[9px] text-amber-400 px-1 py-0.2 rounded bg-amber-950/70"
                              title="Auto Increment"
                            >
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table Relationships Footer */}
                  {(outboundFks.length > 0 || inboundFks.length > 0) && (
                    <div className="bg-slate-950/60 border-t border-slate-800/80 p-2.5 text-[11px] text-slate-400 flex flex-col gap-1">
                      {outboundFks.map((fk) => (
                        <div
                          key={fk.id}
                          className="flex items-center gap-1 font-mono text-slate-300 truncate"
                        >
                          <span className="text-indigo-400">↳ FK:</span>
                          <span className="text-slate-400">{fk.fromColumn}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-emerald-300">{fk.toTable}</span>
                          <span className="text-[9px] text-slate-500">
                            [{fk.onDelete}]
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
