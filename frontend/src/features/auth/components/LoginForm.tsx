'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    const success = await login(trimmedEmail, password);
    if (success) {
      router.push('/designer');
      router.refresh();
    }
  };

  const displayedError = localError || error;

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono font-bold text-sm mb-3">
          DB
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Sign in to DB Architect</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Access your workspaces, relational models, and saved schemas
        </p>
      </div>

      {displayedError && (
        <div className="mb-6 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2.5">
          <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{displayedError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-zinc-300 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-zinc-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-zinc-950" viewBox="0 0 24 24">
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
              <span>Signing in...</span>
            </>
          ) : (
            'Continue with Email'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-white hover:underline font-medium transition-colors"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}
