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
    const success = await generateFromDescription(description.trim());
    if (success) {
      // Suggest switching to refine for follow-up prompts
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    setDescription(promptText);
    setError(null);
  };

  const charCount = description.length;
  const isOverLimit = charCount > 2000;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-r border-slate-800 text-slate-100 p-5 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            AI Schema Designer
          </h2>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          {activeTab === 'generate' ? 'Describe Your Database' : 'Refine Your Schema'}
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {activeTab === 'generate'
            ? 'Type your requirements in plain English. The AI generates a validated relational schema with primary keys and relationships.'
            : 'Provide instructions to extend, modify, or enhance the active relational model.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'generate'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✨ Generate New
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refine')}
          className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'refine'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ Refine Schema
        </button>
      </div>

      {activeTab === 'refine' ? (
        <RefineBox />
      ) : (
        /* Form */
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        {/* Dialect selector */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Target SQL Dialect
          </label>
          <div role="radiogroup" aria-label="Target SQL Dialect">
            <button
              type="button"
              role="radio"
              aria-checked={dialect === 'postgresql'}
              onClick={() => setDialect('postgresql')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dialect === 'postgresql'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>🐘</span> PostgreSQL
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={dialect === 'mysql'}
              onClick={() => setDialect('mysql')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dialect === 'mysql'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>🐬</span> MySQL
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="description"
              className="text-xs font-medium text-slate-300"
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
                    : 'text-slate-400'
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
            placeholder="e.g. Design a food delivery app with restaurants, menu items, customer orders, delivery drivers, and review ratings..."
            className={`w-full rounded-lg bg-slate-950/70 border p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-y ${
              isOverLimit
                ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }`}
          />
        </div>

        {/* Quick prompt inspiration chips */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Examples
          </span>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => handleSelectPrompt(sample.prompt)}
                disabled={isGenerating}
                className="text-left py-1.5 px-2.5 rounded-md text-xs bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 transition-colors"
              >
                <span className="font-medium text-indigo-300 block">
                  {sample.title}
                </span>
                <span className="text-[11px] text-slate-400 line-clamp-1">
                  {sample.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Note (V10) */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400">
          <span className="text-amber-400 mt-0.5">ℹ</span>
          <span>
            Prompts are processed via secure AI SDK. Do not enter passwords,
            API keys, or confidential information.
          </span>
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
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              !description.trim() || isOverLimit || isGenerating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-indigo-600/30'
            }`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                <span>Designing Schema...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Schema</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={loadSample}
            disabled={isGenerating}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 transition-colors text-center"
          >
            Reset to Sample Schema
          </button>
        </div>

        {/* Privacy & Storage Notice (T11.8 / Security V10) */}
        <div className="mt-1 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <span>🛡️</span>
            <span>Privacy & Storage Notice</span>
          </div>
          <p>
            Descriptions are sent to an AI service to compile relational schemas. Do not enter confidential or proprietary data.
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 space-y-0.5">
            <div><strong className="text-slate-400">Stored:</strong> Your email and schemas you explicitly save.</div>
            <div><strong className="text-slate-400">Never stored:</strong> Natural language prompts or descriptions.</div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
