'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '../../../lib/api';
import { useSchemaStore } from '../../designer/store/schema.store';
import type { Dialect } from '../../designer/types';

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
      const res = await api.listSavedSchemas();
      setItems(res.items);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to load saved schemas.';
      setError(msg);
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
          const msg =
            err instanceof ApiClientError
              ? err.message
              : 'Failed to load saved schemas.';
          setError(msg);
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
      router.push('/');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>📁</span> My Saved Schemas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your relational schemas. Loaded schemas open directly into the interactive designer canvas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Storage: <strong className="text-indigo-400">{items.length}</strong> / 50
          </span>
          <Link
            href="/"
            className="text-xs py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>⚡</span> Open Studio
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="my-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-white"
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
                className="h-36 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-base font-semibold text-white mb-1">
              No saved schemas yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Create a schema in the Designer Studio using natural language and save it here to keep your work synchronized.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Start Designing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {/* Render plain text to prevent XSS (Security V24) */}
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                        item.dialect === 'postgresql'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {item.dialect}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Updated:{' '}
                    {new Date(item.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenIntoDesigner(item.id)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteItem(item)}
                      title="Delete schema"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      🗑️
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Rename Schema</h3>
            {renameError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs">
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
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Delete Schema</h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-white">&quot;{deleteItem.name}&quot;</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl disabled:opacity-50"
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
