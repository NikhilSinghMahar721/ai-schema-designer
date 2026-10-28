'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

export function UserMenu() {
  const router = useRouter();
  const {
    user,
    isLoading,
    isInitialLoading,
    fetchCurrentUser,
    logout,
    deleteAccount,
    error,
    clearError,
  } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    clearError();

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    const success = await deleteAccount(deletePassword);
    setIsDeleting(false);

    if (success) {
      setShowDeleteModal(false);
      setDeletePassword('');
      router.push('/');
      router.refresh();
    } else {
      setDeleteError(error || 'Failed to delete account. Please verify your password.');
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-20 bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Guest State
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-xs px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm shadow-indigo-600/30"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Authenticated State
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-medium transition-all cursor-pointer"
      >
        <span className="h-5 w-5 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
          {user.email.charAt(0)}
        </span>
        <span className="max-w-[130px] truncate">{user.email}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
          <div className="px-4 py-2 border-b border-slate-800">
            <p className="text-[11px] text-slate-400">Signed in as</p>
            <p className="font-semibold text-slate-100 truncate mt-0.5">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/schemas"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span>📁</span>
              <span>My Saved Schemas</span>
            </Link>

            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span>🎨</span>
              <span>Designer Studio</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowDeleteModal(true);
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <span>🗑️</span>
              <span>Delete Account</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal Dialog (T11.7) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/30 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-white">Delete Account</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This action is permanent and cannot be undone. All your account
              information and all saved schemas will be permanently deleted from
              our servers.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label
                  htmlFor="delete-confirm-password"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Enter your password to confirm
                </label>
                <input
                  id="delete-confirm-password"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white font-medium transition-colors shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
