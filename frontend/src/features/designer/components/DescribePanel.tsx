'use client';

/**
 * DescribePanel — Left-side panel for natural-language schema description.
 * Allows entering a prompt, selecting dialect, clicking quick inspiration chips,
 * and generating schemas via the backend AI API.
 */

import React, { useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import { RefineBox } from './RefineBox';
import { ErrorBanner } from './ErrorBanner';

const SAMPLE_PROMPTS = [
  {
    title: 'E-Commerce Store',
    prompt:
      'An e-commerce platform with customers, product catalog, categories, shopping carts, orders, and payment records with status tracking.',
  },
  {
    title: 'SaaS Subscription & Billing',
    prompt:
      'A multi-tenant SaaS application with organizations, users, role permissions, subscription tiers, invoices, and audit logging.',
  },
  {
    title: 'Online Learning Platform',
    prompt:
      'A learning platform with instructors, courses, lessons, student enrollments, quiz submissions, and course completion certificates.',
  },
];

export function DescribePanel() {
  const [activeTab, setActiveTab] = useState<'generate' | 'refine'>('generate');
  const [description, setDescription] = useState('');
  const {
    dialect,
    setDialect,
    generateFromDescription,
    isGenerating,
    error,
    errorStatus,
    setError,
    loadSample,
  } = useSchemaStore();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isGenerating) return;

    setError(null);
    await generateFromDescription(description.trim());
  };

  const handleSelectPrompt = (promptText: string) => {
    setDescription(promptText);
    setError(null);
  };

  const charCount = description.length;
  const isOverLimit = charCount > 2000;

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 text-zinc-100 p-5 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
            AI Schema Designer
          </h2>
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          {activeTab === 'generate' ? 'Describe Database' : 'Refine Schema'}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          {activeTab === 'generate'
            ? 'Type domain requirements in plain English. The AI synthesizes a normalized relational schema with keys and constraints.'
            : 'Provide instructions to extend, normalize, or adjust the active relational model.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            activeTab === 'generate'
              ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Generate New
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refine')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            activeTab === 'refine'
              ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Refine Schema
        </button>
      </div>

      {activeTab === 'refine' ? (
        <RefineBox />
      ) : (
        /* Form */
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          {/* Dialect selector */}
          <div>
            <label className="text-xs font-mono font-medium text-zinc-400 block mb-1.5">
              TARGET SQL DIALECT
            </label>
            <div role="radiogroup" aria-label="Target SQL Dialect" className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                role="radio"
                aria-checked={dialect === 'postgresql'}
                onClick={() => setDialect('postgresql')}
                className={`py-1.5 px-3 rounded-md border text-center font-medium transition-all cursor-pointer ${
                  dialect === 'postgresql'
                    ? 'bg-zinc-800 border-zinc-650 text-white font-semibold shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                PostgreSQL
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={dialect === 'mysql'}
                onClick={() => setDialect('mysql')}
                className={`py-1.5 px-3 rounded-md border text-center font-medium transition-all cursor-pointer ${
                  dialect === 'mysql'
                    ? 'bg-zinc-800 border-zinc-650 text-white font-semibold shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                MySQL
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="description"
                className="text-xs font-medium text-zinc-300"
              >
                Requirements Prompt
              </label>
              <span
                id="description-counter"
                className={`text-[11px] font-mono ${
                  isOverLimit
                    ? 'text-rose-400 font-bold'
                    : charCount > 1800
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                }`}
              >
                {charCount} / 2000
              </span>
            </div>

            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating}
              aria-describedby="description-counter"
              placeholder="Describe your database requirements (e.g., A library management system with books, authors, members, and book loans with checkout dates)..."
              className={`w-full rounded-lg bg-zinc-950 border p-3 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all resize-y ${
                isOverLimit
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
              }`}
            />
          </div>

          {/* Quick prompt inspiration chips */}
          <div>
            <span className="text-[11px] font-mono text-zinc-500 block mb-2">
              EXAMPLE PROMPTS
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleSelectPrompt(sample.prompt)}
                  disabled={isGenerating}
                  className="text-left py-2 px-3 rounded-md text-xs bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-zinc-200 block">
                    {sample.title}
                  </span>
                  <span className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 font-mono">
                    {sample.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400">
            Prompts are processed ephemerally. Do not enter credentials, private keys, or confidential trade secrets.
          </div>

          {/* Error Alert */}
          <ErrorBanner
            error={error}
            statusCode={errorStatus ?? undefined}
            onDismiss={() => setError(null)}
          />

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={!description.trim() || isOverLimit || isGenerating}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                !description.trim() || isOverLimit || isGenerating
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
                  : 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-zinc-950"
                    xmlns="http://www.w3.org/2000/svg"
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
                  <span>Synthesizing Schema...</span>
                </>
              ) : (
                <span>Generate Schema</span>
              )}
            </button>

            <button
              type="button"
              onClick={loadSample}
              disabled={isGenerating}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors text-center cursor-pointer"
            >
              Reset to Sample Schema
            </button>
          </div>

          {/* Privacy & Storage Notice */}
          <div className="mt-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed font-mono">
            <div className="text-zinc-300 font-semibold mb-1">
              Data Isolation
            </div>
            <p className="text-[10px] text-zinc-500">
              Only explicitly saved schemas are stored. Prompts are never written to disk or database logs.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
