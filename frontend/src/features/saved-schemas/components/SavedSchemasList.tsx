'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '../../../lib/api';
import { useSchemaStore } from '../../designer/store/schema.store';
import type { Dialect } from '../../designer/types';
import { ErrorBanner } from '../../designer/components/ErrorBanner';

interface SchemaItem {
  id: string;
  name: string;
  dialect: Dialect;
  updatedAt: string;
}

export function SavedSchemasList() {
  const router = useRouter();
  const { setSchema, setDialect } = useSchemaStore();

  const [items, setItems] = useState<SchemaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Rename state
  const [renameItem, setRenameItem] = useState<SchemaItem | null>(null);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Delete state
  const [deleteItem, setDeleteItem] = useState<SchemaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorStatus(null);
      const res = await api.listSavedSchemas();
      setItems(res.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setErrorStatus(err.status);
      } else {
        setError('Failed to load saved schemas.');
        setErrorStatus(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await api.listSavedSchemas();
        if (!ignore) {
          setItems(res.items);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof ApiClientError) {
            setError(err.message);
            setErrorStatus(err.status);
          } else {
            setError('Failed to load saved schemas.');
            setErrorStatus(null);
          }
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenIntoDesigner = async (id: string) => {
    try {
      setActionError(null);
      const res = await api.getSavedSchema(id);
      setSchema(res.item.schema);
      setDialect(res.item.dialect);
      router.push('/designer');
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Could not load schema into studio.';
      setActionError(msg);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItem) return;
    setRenameError(null);

    const trimmed = newName.trim();
    if (!trimmed) {
      setRenameError('Name cannot be empty.');
      return;
    }

    try {
      setIsRenaming(true);
      await api.updateSavedSchema(renameItem.id, { name: trimmed });
      setItems((prev) =>
        prev.map((item) =>
          item.id === renameItem.id ? { ...item, name: trimmed, updatedAt: new Date().toISOString() } : item,
        ),
      );
      setRenameItem(null);
      setNewName('');
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Rename failed.';
      setRenameError(msg);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await api.deleteSavedSchema(deleteItem.id);
      setItems((prev) => prev.filter((item) => item.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Failed to delete schema.';
      setActionError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>My Saved Schemas</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your relational schemas. Loaded schemas open directly into the interactive designer canvas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
            Storage: <strong className="text-white">{items.length}</strong> / 50
          </span>
          <Link
            href="/designer"
            className="text-xs py-2 px-3.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>Open Studio</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="my-4 p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800">
            <ErrorBanner
              error={error}
              statusCode={errorStatus ?? undefined}
              onDismiss={() => {
                setError(null);
                setErrorStatus(null);
              }}
            />
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-md text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-colors mt-3"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 border-dashed">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 3.5 3 8 3s8-1 8-3V7M4 7c0 2 3.5 3 8 3s8-1 8-3M4 7c0-2 3.5-3 8-3s8 1 8 3m0 5c0 2-3.5 3-8 3s-8-1-8-3" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              No saved schemas yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
              Create a schema in the Designer Studio using natural language and save it here to keep your work synchronized.
            </p>
            <Link
              href="/designer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors shadow-sm"
            >
              Start Designing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-5 flex flex-col justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {/* Render plain text to prevent XSS (Security V24) */}
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate font-mono">
                      {item.name}
                    </h3>
                    <span
                      className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold shrink-0 border bg-zinc-800 text-zinc-300 border-zinc-700"
                    >
                      {item.dialect}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono">
                    Updated:{' '}
                    {new Date(item.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenIntoDesigner(item.id)}
                    className="text-zinc-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Open in Studio</span>
                    <span>→</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRenameItem(item);
                        setNewName(item.name);
                      }}
                      title="Rename schema"
                      className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteItem(item)}
                      title="Delete schema"
                      className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Rename Schema</h3>
            {renameError && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-950/40 text-rose-300 text-xs">
                {renameError}
              </div>
            )}
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                required
                maxLength={100}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameItem(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-4 py-1.5 text-xs bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded-md disabled:opacity-50"
                >
                  {isRenaming ? 'Saving...' : 'Rename'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Delete Schema</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Are you sure you want to delete <strong className="text-white">&quot;{deleteItem.name}&quot;</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-md disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
