'use client';

/**
 * AiChatPanel.tsx — Left-side interactive AI Chat Assistant.
 * Provides a conversational message stream (like ChatGPT/Cursor)
 * where prompts and AI synthesis responses flow as persistent messages,
 * supporting natural schema creation and ongoing refinements.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSchemaStore } from '../store/schema.store';
import type { Dialect } from '../types';

interface AiChatPanelProps {
  onClose?: () => void;
  onShowToast: (message: string) => void;
}

const QUICK_CHIPS = [
  { label: '+ Timestamps', prompt: 'Add created_at and updated_at TIMESTAMP to all tables' },
  { label: '+ Payments', prompt: 'Add payments table with payment_method, amount, currency, and link to orders' },
  { label: '+ Soft Deletes', prompt: 'Add deleted_at TIMESTAMP nullable column to primary entity tables' },
  { label: '+ Categories', prompt: 'Add categories and product_categories junction table' },
  { label: 'Student System', prompt: 'Create student management system with students, courses, enrollments, and grades' },
  { label: 'E-Commerce', prompt: 'Create e-commerce platform with customers, products, orders, order_items, and payments' },
];

export function AiChatPanel({ onClose, onShowToast }: AiChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    schema,
    dialect,
    setDialect,
    chatMessages,
    isGenerating,
    isRefining,
    generateFromDescription,
    refineFromInstruction,
    clearChatMessages,
    setSelectedTable,
  } = useSchemaStore();

  const isBusy = isGenerating || isRefining;
  const hasTables = schema.tables.length > 0;

  // Auto-scroll to bottom whenever new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBusy]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isBusy) return;

    setInputText('');

    if (hasTables) {
      const res = await refineFromInstruction(trimmed);
      if (res.success) {
        onShowToast('Schema refined successfully!');
      } else {
        onShowToast(res.error || 'Failed to refine schema.');
      }
    } else {
      const success = await generateFromDescription(trimmed);
      if (success) {
        onShowToast('Relational schema synthesized!');
      } else {
        onShowToast('Failed to synthesize schema.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectTablePill = (tableName: string) => {
    const table = schema.tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
    if (table) {
      setSelectedTable(table.id);
      onShowToast(`Focused table "${tableName}" on canvas`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden select-text">
      {/* Top Header */}
      <div className="h-13 border-b border-zinc-800 px-3.5 flex items-center justify-between bg-zinc-950/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight leading-none">
              AI Schema Architect
            </h2>
            <span className="text-[10px] text-zinc-400 font-mono">
              Natural Language Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dialect Switcher Pill */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setDialect('postgresql')}
              className={`px-2 py-0.5 rounded transition-colors ${
                dialect === 'postgresql'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Target dialect: PostgreSQL"
            >
              PG
            </button>
            <button
              type="button"
              onClick={() => setDialect('mysql')}
              className={`px-2 py-0.5 rounded transition-colors ${
                dialect === 'mysql'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Target dialect: MySQL"
            >
              MySQL
            </button>
          </div>

          {/* Clear Chat History */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear AI conversation history?')) {
                clearChatMessages();
                onShowToast('Chat conversation cleared');
              }
            }}
            title="Clear chat history"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Collapse Panel Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Collapse AI panel"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 font-sans">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender / Role indicator */}
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-zinc-500">
              {msg.role === 'user' ? (
                <span>You</span>
              ) : (
                <span className="flex items-center gap-1 text-blue-400 font-medium">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  AI Architect
                </span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[92%] shadow-sm ${
                msg.role === 'user'
                  ? 'bg-zinc-800 border border-zinc-700/80 text-zinc-100 rounded-tr-xs'
                  : msg.isError
                    ? 'bg-rose-950/30 border border-rose-900/60 text-rose-200 rounded-tl-xs'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Generated Tables Badges / Quick Highlighters */}
              {msg.tables && msg.tables.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                  <div className="text-[10px] uppercase font-mono text-zinc-400 mb-1.5 flex items-center justify-between">
                    <span>Generated Tables ({msg.tables.length}):</span>
                    {msg.relationshipsCount !== undefined && (
                      <span className="text-blue-400 font-mono">
                        {msg.relationshipsCount} FK {msg.relationshipsCount === 1 ? 'relation' : 'relations'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {msg.tables.map((tbl) => (
                      <button
                        key={tbl}
                        type="button"
                        onClick={() => handleSelectTablePill(tbl)}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-mono text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        title={`Click to focus table "${tbl}" on canvas`}
                      >
                        <span className="text-zinc-500 text-[10px]">#</span>
                        <span>{tbl}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Busy / Synthesizing Indicator Bubble */}
        {isBusy && (
          <div className="flex flex-col items-start animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>AI Architect is thinking...</span>
            </div>
            <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-zinc-950 border border-blue-900/40 text-xs text-zinc-300 flex items-center gap-2 shadow-sm">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-mono text-[11px] text-zinc-400">
                {hasTables
                  ? 'Refining relational schema architecture...'
                  : 'Synthesizing tables, columns & constraints...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer Area */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 shrink-0 space-y-2">
        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={isBusy}
              onClick={() => setInputText(chip.prompt)}
              className="px-2 py-0.5 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 shrink-0 transition-colors font-mono text-[10px] cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
              placeholder={
                hasTables
                  ? 'Refine schema (e.g., Add payments table linked to orders)...'
                  : 'Describe your database (e.g., Student management system)...'
              }
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-650 transition-colors resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isBusy}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center disabled:opacity-40 transition-colors shrink-0 shadow-sm cursor-pointer"
            title="Send prompt (Enter)"
          >
            {isBusy ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{dialect.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
