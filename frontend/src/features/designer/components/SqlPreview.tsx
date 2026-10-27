'use client';

/**
 * SqlPreview — Right-side panel for inspecting deterministic SQL DDL.
 * Automatically requests export from /api/schema/export when schema or dialect changes.
 * Allows copying to clipboard and downloading as a .sql file.
 */

import React, { useEffect, useState } from 'react';
import { useSchemaStore } from '../store/schema.store';
import { api, ApiClientError } from '../../../lib/api';

export function SqlPreview() {
  const { schema, dialect, setDialect } = useSchemaStore();
  const [sql, setSql] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch exported SQL on schema or dialect change
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
          } else {
            setError('Failed to generate SQL export.');
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

  const handleDownload = () => {
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

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-l border-slate-800 text-slate-100 p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>💾</span> SQL Preview
          </h2>
          <span className="text-[11px] text-slate-400">
            Deterministic DDL Generator
          </span>
        </div>

        {/* Dialect Switcher */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setDialect('postgresql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'postgresql'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PG
          </button>
          <button
            type="button"
            onClick={() => setDialect('mysql')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              dialect === 'mysql'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MySQL
          </button>
        </div>
      </div>

      {/* Code Editor Preview Area */}
      <div className="flex-1 my-3 bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-auto font-mono text-xs relative group">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <span>Generating SQL DDL...</span>
          </div>
        ) : error ? (
          <div className="p-3 text-rose-400 bg-rose-950/30 rounded-lg">
            <span className="font-bold">Error:</span> {error}
          </div>
        ) : (
          <pre className="text-slate-200 whitespace-pre overflow-x-auto leading-relaxed">
            <code>{sql}</code>
          </pre>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
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
          onClick={handleDownload}
          disabled={!sql || isLoading}
          className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-[0.99] border border-slate-700/80 text-white transition-all flex items-center justify-center gap-1.5"
          title="Download .sql file"
        >
          <span>⬇️</span> Download
        </button>
      </div>
    </div>
  );
}
