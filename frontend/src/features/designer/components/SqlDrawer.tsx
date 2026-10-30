'use client';

import React, { useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import { generateSql } from '../../../lib/sqlGenerator';
import { copySqlToClipboard, downloadSqlFile } from '../../../lib/exportUtils';
import type { Dialect } from '../types';

interface SqlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export function SqlDrawer({ isOpen, onClose, onShowToast }: SqlDrawerProps) {
  const { schema, dialect, setDialect } = useSchemaStore();
  const [activeDialect, setActiveDialect] = useState<Dialect>(dialect);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDialect = activeDialect || dialect;
  const sql = generateSql(schema, currentDialect);

  const handleDialectChange = (newDialect: Dialect) => {
    setActiveDialect(newDialect);
    setDialect(newDialect);
  };

  const handleCopy = async () => {
    const success = await copySqlToClipboard(schema, currentDialect);
    if (success) {
      setCopied(true);
      onShowToast(`Copied ${currentDialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'} SQL!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadSqlFile(schema, currentDialect);
    onShowToast(`Downloaded ${currentDialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'} .sql script`);
  };

  const lineCount = sql.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-bold text-white font-mono">SQL DDL Export</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Dialect Switcher */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleDialectChange('postgresql')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  currentDialect === 'postgresql'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                PostgreSQL
              </button>
              <button
                type="button"
                onClick={() => handleDialectChange('mysql')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  currentDialect === 'mysql'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                MySQL
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="py-2.5 px-5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono text-zinc-400">
            {lineCount} lines • {schema.tables.length} tables
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs text-zinc-200 bg-zinc-950 selection:bg-blue-500/30">
          <pre className="leading-relaxed whitespace-pre font-mono">
            <code>{sql}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
