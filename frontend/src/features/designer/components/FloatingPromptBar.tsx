'use client';

import React, { useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import type { Dialect } from '../types';

interface FloatingPromptBarProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

const PRESET_CHIPS = [
  { label: '+ Timestamps', instruction: 'Add created_at and updated_at TIMESTAMP to all tables' },
  { label: '+ Payments', instruction: 'Add payments table with payment_method, amount, currency, and link to orders' },
  { label: '+ Soft Deletes', instruction: 'Add deleted_at TIMESTAMP nullable column to primary entity tables' },
  { label: '+ Categories', instruction: 'Add categories and product_categories junction table' },
];

export function FloatingPromptBar({
  isOpen,
  onClose,
  onShowToast,
}: FloatingPromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    schema,
    dialect,
    setDialect,
    isGenerating,
    isRefining,
    generateFromDescription,
    refineFromInstruction,
  } = useSchemaStore();

  if (!isOpen) return null;

  const isBusy = isGenerating || isRefining;
  const isRefinementMode = schema.tables.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isBusy) return;

    setLocalError(null);

    if (isRefinementMode) {
      const res = await refineFromInstruction(trimmed);
      if (res.success) {
        setPrompt('');
        onShowToast('Schema refined successfully!');
      } else {
        setLocalError(res.error || 'Failed to refine schema. Please try again.');
      }
    } else {
      const success = await generateFromDescription(trimmed);
      if (success) {
        setPrompt('');
        onShowToast('Relational schema synthesized!');
      } else {
        setLocalError('Failed to generate schema. Please verify your prompt.');
      }
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 pointer-events-none">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-2.5 pointer-events-auto transition-all animate-in slide-in-from-bottom duration-200">
        {/* Quick Suggestion Chips */}
        {isRefinementMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 px-1 text-[11px] no-scrollbar">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold shrink-0">
              Suggestions:
            </span>
            {PRESET_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={isBusy}
                onClick={() => setPrompt(chip.instruction)}
                className="px-2 py-0.5 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 shrink-0 transition-colors font-mono cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3 text-zinc-400">
              {isBusy ? (
                <svg className="animate-spin h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </span>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isBusy}
              placeholder={
                isRefinementMode
                  ? 'Refine current schema (e.g. Add invoices table with status and amount)...'
                  : 'Describe your database (e.g. E-commerce store with orders, items, and users)...'
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Dialect Switcher */}
          {!isRefinementMode && (
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              disabled={isBusy}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isBusy}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-40 text-xs font-semibold transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            {isBusy ? 'Synthesizing...' : isRefinementMode ? 'Refine' : 'Generate'}
          </button>

          {/* Close / Minimize */}
          <button
            type="button"
            title="Minimize prompt bar"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        {localError && (
          <div className="mt-2 text-[11px] text-rose-400 px-2 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{localError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
