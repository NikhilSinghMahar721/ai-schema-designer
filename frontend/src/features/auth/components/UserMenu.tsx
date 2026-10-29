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
        <div className="h-7 w-20 bg-zinc-800 animate-pulse rounded-md" />
      </div>
    );
  }

  // Guest State
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-xs px-3 py-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="text-xs px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium transition-colors shadow-sm"
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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
      >
        <span className="h-5 w-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-200 uppercase shrink-0">
          {user.email.charAt(0)}
        </span>
        <span className="max-w-[130px] truncate font-mono text-[11px]">{user.email}</span>
        <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 z-50 text-xs">
          <div className="px-3.5 py-2 border-b border-zinc-800">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Signed in as</p>
            <p className="font-mono text-zinc-200 truncate mt-0.5 text-[11px]">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/schemas"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>My Saved Schemas</span>
            </Link>

            <Link
              href="/designer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>Designer Studio</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowDeleteModal(true);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Account</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-bold text-white">Delete Account</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              This action is permanent and cannot be undone. All your account
              information and all saved schemas will be permanently deleted from
              our servers.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label
                  htmlFor="delete-confirm-password"
                  className="block text-xs font-medium text-zinc-300 mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
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
                  className="px-4 py-2 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-md text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
