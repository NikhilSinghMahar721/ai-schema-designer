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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💾</span>
            <h2 className="text-base font-bold text-white">Save Schema to Cloud</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Guest View: prompt login/register */}
        {!user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
              <p className="font-semibold text-white mb-1">
                Cloud save requires an account
              </p>
              Sign in or create an account to save up to 50 relational database
              schemas, open them from any device, and manage versions.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs text-center transition-colors shadow-md shadow-indigo-600/25"
              >
                Sign In to Save
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition-colors"
              >
                Create Free Account
              </Link>
              <button
                type="button"
                onClick={() => {
                  exportJson();
                  onClose();
                }}
                className="mt-1 text-slate-400 hover:text-slate-300 text-xs py-1 transition-colors cursor-pointer"
              >
                Or download as a local .json file (guests)
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated View: name input & save */
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {successMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="saved-schema-name"
                className="block text-xs font-medium text-slate-300 mb-1"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                Tables: <strong className="text-white">{schema.tables.length}</strong>
              </span>
              <span>
                Relations: <strong className="text-white">{schema.relationships.length}</strong>
              </span>
              <span>
                Dialect:{' '}
                <strong className="text-emerald-400 uppercase font-mono">
                  {dialect}
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
