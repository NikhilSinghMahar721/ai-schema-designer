'use client';

/**
 * SqlPreview.tsx — Right-side panel for inspecting deterministic SQL DDL.
 * Automatically requests export from /api/schema/export when schema or dialect changes (debounced).
 * Supports copying to clipboard, downloading .sql files, dialect switching (PostgreSQL / MySQL),
 * and exporting/importing schema JSON locally.
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

    const timer = setTimeout(fetchSql, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [schema, dialect]);

  const handleCopy = async () => {
    if (!sql || isLoading) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = sql;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSql = () => {
    if (!sql || isLoading) return;
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.${dialect === 'postgresql' ? 'pg' : 'mysql'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 text-zinc-100 p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
        <div>
          <h2 className="text-xs font-mono font-semibold text-white tracking-wider uppercase">
            SQL Preview
          </h2>
          <span className="text-[11px] text-zinc-400 font-mono">
            Deterministic DDL
          </span>
        </div>

        {/* Dialect Switcher */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setDialect('postgresql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'postgresql'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            PostgreSQL
          </button>
          <button
            type="button"
            onClick={() => setDialect('mysql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'mysql'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
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
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          <span>{jsonNotice.message}</span>
          <button
            type="button"
            onClick={() => setJsonNotice(null)}
            className="text-xs hover:opacity-75 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Code Editor Preview Area */}
      <div className="flex-1 my-3 bg-zinc-950 rounded-lg border border-zinc-800 p-3 overflow-auto font-mono text-xs relative group">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
            <div className="w-3.5 h-3.5 border-2 border-zinc-500/30 border-t-zinc-300 rounded-full animate-spin" />
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
          <pre className="text-zinc-200 whitespace-pre overflow-x-auto leading-relaxed">
            <code>{sql}</code>
          </pre>
        )}
      </div>

      {/* Primary Actions: Copy & Download SQL */}
      <div className="pt-2 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!sql || isLoading}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.99] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <span>Copied to Clipboard</span>
          ) : (
            <span>Copy SQL</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadSql}
          disabled={!sql || isLoading}
          className="py-2 px-3 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-750 active:scale-[0.99] border border-zinc-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download .sql file"
        >
          <span>Download .sql</span>
        </button>
      </div>

      {/* Secondary Actions: Local JSON Export & Import */}
      <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono shrink-0">
        <span className="text-[11px] text-zinc-500">Local JSON:</span>
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
            className="py-1 px-2 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] transition-colors cursor-pointer"
            title="Import schema from local .json file"
          >
            Load JSON
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="py-1 px-2 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] transition-colors cursor-pointer"
            title="Save schema as local .json file"
          >
            Save JSON
          </button>
        </div>
      </div>
    </div>
  );
}
