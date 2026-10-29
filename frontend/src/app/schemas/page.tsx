'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { SavedSchemasList } from '../../features/saved-schemas/components/SavedSchemasList';
import { UserMenu } from '../../features/auth/components/UserMenu';

export default function SchemasPage() {
  const router = useRouter();
  const { user, isInitialLoading, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Guest redirection (UI convenience; backend is the true authority)
  useEffect(() => {
    if (!isInitialLoading && !user) {
      router.push('/login');
    }
  }, [isInitialLoading, user, router]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 text-xs">
          <svg className="animate-spin h-4 w-4 text-zinc-200" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading your account...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection is occurring
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-mono font-bold text-xs">
              DB
            </div>
            <span className="font-semibold text-sm tracking-tight text-white font-mono">
              DB Architect
            </span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-xs text-zinc-400 font-medium font-mono">My Schemas</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/designer"
            className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Open Studio</span>
            <span>→</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800 mx-0.5" />
          <UserMenu />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        <SavedSchemasList />
      </main>
    </div>
  );
}
