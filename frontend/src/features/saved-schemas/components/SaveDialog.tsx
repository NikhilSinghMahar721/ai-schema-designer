'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../auth/store/auth.store';
import { useSchemaStore } from '../../designer/store/schema.store';
import { api, ApiClientError } from '../../../lib/api';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveDialog({ isOpen, onClose }: SaveDialogProps) {
  const { user } = useAuthStore();
  const { schema, dialect, exportJson } = useSchemaStore();

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a name for your schema.');
      return;
    }

    if (trimmed.length > 100) {
      setError('Schema name must be 100 characters or fewer.');
      return;
    }

    try {
      setIsSaving(true);
      await api.createSavedSchema({
        name: trimmed,
        dialect,
        schema,
      });

      setSuccessMessage('Schema saved successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        setName('');
        onClose();
      }, 1200);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to save schema. Please try again.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <h2 className="text-base font-bold text-white">Save Schema to Cloud</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-base p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Guest View: prompt login/register */}
        {!user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
              <p className="font-semibold text-white mb-1">
                Cloud save requires an account
              </p>
              Sign in or create an account to save up to 50 relational database
              schemas, open them from any device, and manage versions.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs text-center transition-colors shadow-sm"
              >
                Sign In to Save
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 px-4 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs text-center border border-zinc-700 transition-colors"
              >
                Create Free Account
              </Link>
              <button
                type="button"
                onClick={() => {
                  exportJson();
                  onClose();
                }}
                className="mt-1 text-zinc-400 hover:text-zinc-200 text-xs py-1 transition-colors cursor-pointer text-center"
              >
                Or download as a local .json file
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated View: name input & save */
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs font-medium">
                {successMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="saved-schema-name"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Schema Name
              </label>
              <input
                id="saved-schema-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. E-Commerce Core v1"
                className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>
                Tables: <strong className="text-white">{schema.tables.length}</strong>
              </span>
              <span>
                Relations: <strong className="text-white">{schema.relationships.length}</strong>
              </span>
              <span>
                Dialect:{' '}
                <strong className="text-zinc-200 uppercase">
                  {dialect}
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-md text-xs bg-white hover:bg-zinc-200 text-zinc-950 font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Schema'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
