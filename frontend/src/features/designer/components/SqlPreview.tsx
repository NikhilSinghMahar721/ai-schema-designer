'use client';

/**
 * SqlPreview.tsx — Right-side panel for inspecting deterministic SQL DDL.
 * Automatically requests export from /api/schema/export when schema or dialect changes (debounced).
 * Supports copying to clipboard, downloading .sql files, dialect switching (PostgreSQL / MySQL),
 * and exporting/importing schema JSON locally for guest users (T7.1 - T7.5).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import { api, ApiClientError } from '../../../lib/api';
import { ErrorBanner } from './ErrorBanner';

export function SqlPreview() {
  const {
    schema,
    dialect,
    setDialect,
    exportJson,
    importJson,
  } = useSchemaStore();

  const [sql, setSql] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [jsonNotice, setJsonNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch exported SQL on schema or dialect change (debounced 200ms)
  useEffect(() => {
    let isCancelled = false;

    const fetchSql = async () => {
      if (schema.tables.length === 0) {
        if (!isCancelled) {
          setSql('-- No tables defined in schema.');
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const exported = await api.exportSql(schema, dialect);
        if (!isCancelled) {
          setSql(exported);
        }
      } catch (err) {
        if (!isCancelled) {
          if (err instanceof ApiClientError) {
            setError(err.message);
            setErrorStatus(err.status);
          } else {
            setError('Backend unavailable. Start the backend server to generate live SQL DDL.');
            setErrorStatus(null);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchSql, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [schema, dialect]);

  const handleCopy = async () => {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSql = () => {
    if (!sql) return;
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema_${dialect}_${Date.now()}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = importJson(content);
      if (res.success) {
        setJsonNotice({
          type: 'success',
          message: `Successfully loaded schema (${file.name}).`,
        });
        setTimeout(() => setJsonNotice(null), 3500);
      } else {
        setJsonNotice({
          type: 'error',
          message: res.error || 'Failed to import JSON.',
        });
      }
    };
    reader.readAsText(file);

    // Reset input value so same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-l border-slate-800 text-slate-100 p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>💾</span> SQL Preview
          </h2>
          <span className="text-[11px] text-slate-400">
            Deterministic DDL Generator
          </span>
        </div>

        {/* Dialect Switcher (T7.3) */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setDialect('postgresql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'postgresql'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PostgreSQL
          </button>
          <button
            type="button"
            onClick={() => setDialect('mysql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'mysql'
                ? 'bg-amber-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MySQL
          </button>
        </div>
      </div>

      {/* JSON Notice Banner */}
      {jsonNotice && (
        <div
          className={`my-2 p-2 rounded text-xs flex items-center justify-between ${
            jsonNotice.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          <span>{jsonNotice.message}</span>
          <button
            type="button"
            onClick={() => setJsonNotice(null)}
            className="text-xs hover:opacity-75 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Code Editor Preview Area */}
      <div className="flex-1 my-3 bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-auto font-mono text-xs relative group">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500 gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span>Compiling DDL...</span>
          </div>
        ) : error ? (
          <ErrorBanner
            error={error}
            statusCode={errorStatus ?? undefined}
            onDismiss={() => {
              setError(null);
              setErrorStatus(null);
            }}
          />
        ) : (
          <pre className="text-slate-200 whitespace-pre overflow-x-auto leading-relaxed">
            <code>{sql}</code>
          </pre>
        )}
      </div>

      {/* Primary Actions: Copy & Download SQL (T7.2) */}
      <div className="pt-2 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!sql || isLoading}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-[0.99] border border-slate-700/80 text-white transition-all flex items-center justify-center gap-1.5"
        >
          {copied ? (
            <>
              <span className="text-emerald-400">✓</span> Copied!
            </>
          ) : (
            <>
              <span>📋</span> Copy SQL
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadSql}
          disabled={!sql || isLoading}
          className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-[0.99] border border-slate-700/80 text-white transition-all flex items-center justify-center gap-1.5"
          title="Download .sql file"
        >
          <span>⬇️</span> Download .sql
        </button>
      </div>

      {/* Secondary Actions: Local JSON Export & Import (T7.5) */}
      <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="text-[11px]">Guest Schema Backup:</span>
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-1 px-2 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
            title="Import schema from local .json file"
          >
            📂 Load JSON
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="py-1 px-2 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
            title="Save schema as local .json file"
          >
            💾 Save JSON
          </button>
        </div>
      </div>
    </div>
  );
}
