'use client';

/**
 * RefineBox.tsx — Natural language schema refinement interface.
 * Sends the current schema JSON + refinement instruction to /api/schema/refine.
 * Displays a concise visual diff of tables, columns, and relations added or modified.
 */

import React, { useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import type { SchemaDiffSummary } from '../../../lib/schemaDiff';

const REFINE_PRESETS = [
  {
    label: 'Add Timestamps',
    instruction: 'Add created_at and updated_at TIMESTAMP columns to all tables that do not have them.',
  },
  {
    label: 'Add Payment System',
    instruction: 'Add a payments table with payment_method, amount, currency, status, and link it to orders.',
  },
  {
    label: 'Add Category Tags',
    instruction: 'Add categories and product_categories junction table for many-to-many relationship.',
  },
  {
    label: 'Add Soft Deletes',
    instruction: 'Add a deleted_at TIMESTAMP nullable column to primary entity tables for soft deletes.',
  },
];

export function RefineBox() {
  const [instruction, setInstruction] = useState('');
  const [lastDiff, setLastDiff] = useState<SchemaDiffSummary | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    schema,
    isRefining,
    isGenerating,
    refineFromInstruction,
    undo,
  } = useSchemaStore();

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining || isGenerating) return;

    setLocalError(null);
    setLastDiff(null);

    const result = await refineFromInstruction(instruction.trim());
    if (result.success && result.diff) {
      setLastDiff(result.diff);
      setInstruction('');
    } else if (result.error) {
      setLocalError(result.error);
    }
  };

  const charCount = instruction.length;
  const isOverLimit = charCount > 1000;
  const isDisabled =
    !instruction.trim() ||
    isOverLimit ||
    isRefining ||
    isGenerating ||
    schema.tables.length === 0;

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Intro */}
      <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="font-semibold text-zinc-200 text-xs mb-1 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Refine Current Schema</span>
        </h3>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Describe modifications to the current relational model. The engine updates
          existing tables or introduces new entities while preserving relational constraints.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRefine} className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="refine-instruction"
              className="text-zinc-300 font-medium text-[11px]"
            >
              Refinement Instruction
            </label>
            <span
              className={`text-[10px] font-mono ${
                isOverLimit ? 'text-rose-400 font-bold' : 'text-zinc-500'
              }`}
            >
              {charCount} / 1000
            </span>
          </div>

          <textarea
            id="refine-instruction"
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isRefining || isGenerating}
            placeholder="e.g. Add a coupons table and allow orders to reference an optional coupon_id..."
            className={`w-full rounded-md bg-zinc-950 border p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all resize-y font-mono ${
              isOverLimit
                ? 'border-rose-500'
                : 'border-zinc-800 focus:border-zinc-600'
            }`}
          />
        </div>

        {/* Quick presets */}
        <div>
          <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5 font-semibold">
            Suggested Refinements
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {REFINE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setInstruction(preset.instruction)}
                disabled={isRefining || isGenerating}
                className="py-1.5 px-2 text-left rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors truncate"
                title={preset.instruction}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Local Error */}
        {localError && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px] flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{localError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full py-2.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isDisabled
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              : 'bg-white hover:bg-zinc-200 text-zinc-950 active:scale-[0.99]'
          }`}
        >
          {isRefining ? (
            <>
              <svg
                className="animate-spin h-3.5 w-3.5 text-zinc-950"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Refining Schema...</span>
            </>
          ) : (
            <span>Apply Refinement</span>
          )}
        </button>
      </form>

      {/* Diff Summary Result */}
      {lastDiff && (
        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 space-y-2 mt-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
              <span>✓</span> Changes Applied
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  undo();
                  setLastDiff(null);
                }}
                className="text-[10px] text-zinc-400 hover:text-amber-400 underline font-mono"
              >
                Undo (Ctrl+Z)
              </button>
              <button
                type="button"
                onClick={() => setLastDiff(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {!lastDiff.hasChanges ? (
            <p className="text-zinc-400 text-[11px]">
              No structural schema changes were detected.
            </p>
          ) : (
            <div className="space-y-1.5 text-[11px]">
              {lastDiff.addedTables.length > 0 && (
                <div>
                  <span className="text-emerald-400 font-semibold font-mono">
                    + Added Tables:
                  </span>{' '}
                  <span className="text-zinc-300 font-mono">
                    {lastDiff.addedTables.join(', ')}
                  </span>
                </div>
              )}

              {lastDiff.removedTables.length > 0 && (
                <div>
                  <span className="text-rose-400 font-semibold font-mono">
                    - Removed Tables:
                  </span>{' '}
                  <span className="text-zinc-300 font-mono">
                    {lastDiff.removedTables.join(', ')}
                  </span>
                </div>
              )}

              {lastDiff.modifiedTables.map((mod) => (
                <div key={mod.tableName} className="pl-1 border-l-2 border-zinc-700">
                  <span className="font-medium text-zinc-200 font-mono">
                    ~ {mod.tableName}:
                  </span>
                  {mod.addedColumns.length > 0 && (
                    <div className="text-zinc-300 text-[10px] pl-2">
                      <span className="text-emerald-400">+ cols:</span>{' '}
                      {mod.addedColumns.join(', ')}
                    </div>
                  )}
                  {mod.modifiedColumns.length > 0 && (
                    <div className="text-zinc-300 text-[10px] pl-2">
                      <span className="text-amber-400">~ cols:</span>{' '}
                      {mod.modifiedColumns
                        .map((c) => `${c.columnName} (${c.changes.join(', ')})`)
                        .join('; ')}
                    </div>
                  )}
                  {mod.removedColumns.length > 0 && (
                    <div className="text-zinc-300 text-[10px] pl-2">
                      <span className="text-rose-400">- cols:</span>{' '}
                      {mod.removedColumns.join(', ')}
                    </div>
                  )}
                </div>
              ))}

              {lastDiff.addedRelationships > 0 && (
                <div className="text-zinc-300 font-mono text-[10px]">
                  + {lastDiff.addedRelationships} foreign key relation(s) added
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
