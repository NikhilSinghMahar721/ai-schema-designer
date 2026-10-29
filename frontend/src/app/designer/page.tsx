'use client';

/**
 * Main Designer Studio Page (authenticated workspace).
 * Three-column layout:
 * 1. Describe panel (left)
 * 2. Diagram canvas (center)
 * 3. SQL preview (right)
 * 
 * Unauthenticated visitors see a focused access gate prompting login or registration.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DescribePanel } from '../../features/designer/components/DescribePanel';
import { DiagramCanvas } from '../../features/designer/components/DiagramCanvas';
import { SqlPreview } from '../../features/designer/components/SqlPreview';
import { UserMenu } from '../../features/auth/components/UserMenu';
import { SaveDialog } from '../../features/saved-schemas/components/SaveDialog';
import { useAuthStore } from '../../features/auth/store/auth.store';

type MobileTab = 'describe' | 'diagram' | 'sql';

export default function DesignerPage() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('diagram');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const { user, isInitialLoading, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Unauthenticated Access Gate */}
      {!isInitialLoading && !user && (
        <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-center">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-mono font-bold text-sm mx-auto mb-4">
              DB
            </div>

            <h2 className="text-lg font-bold tracking-tight text-white mb-1.5">
              Sign in to Launch Studio
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              To design relational schemas with AI, manipulate interactive ER diagrams, and export PostgreSQL & MySQL DDL, please sign in.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/login"
                className="block w-full py-2.5 px-4 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors text-center shadow-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 font-medium text-xs transition-colors text-center"
              >
                Create Free Account
              </Link>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <span>←</span>
                  <span>Back to Overview</span>
                </Link>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-3 text-[11px] font-mono text-zinc-500">
              <span>Secure Sessions</span>
              <span>•</span>
              <span>Instant Export</span>
              <span>•</span>
              <span>Free Access</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="h-6 w-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-[11px] tracking-tighter">
              DB
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              AI Schema Designer
            </span>
          </Link>
          <span className="text-zinc-600 hidden sm:inline">/</span>
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline-block">
            workspace
          </span>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('describe')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'describe'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400'
            }`}
          >
            Prompt
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('diagram')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'diagram'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400'
            }`}
          >
            Diagram
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('sql')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'sql'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400'
            }`}
          >
            SQL
          </button>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2.5 text-xs">
          {user && (
            <Link
              href="/schemas"
              className="py-1.5 px-3 rounded-md bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors text-xs"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="hidden sm:inline">My Schemas</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsSaveOpen(true)}
            className="py-1.5 px-3 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 font-semibold flex items-center gap-1.5 transition-colors text-xs cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save Schema</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          <UserMenu />
        </div>
      </header>

      <SaveDialog isOpen={isSaveOpen} onClose={() => setIsSaveOpen(false)} />

      {/* Main 3-Area Studio Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Area: Describe Panel */}
        <div
          className={`w-full md:w-[380px] lg:w-[400px] shrink-0 ${
            mobileTab === 'describe' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <DescribePanel />
        </div>

        {/* Center Area: Diagram Canvas */}
        <div
          className={`flex-1 relative ${
            mobileTab === 'diagram' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <DiagramCanvas />
        </div>

        {/* Right Area: SQL Preview */}
        <div
          className={`w-full md:w-[360px] lg:w-[380px] shrink-0 ${
            mobileTab === 'sql' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <SqlPreview />
        </div>
      </main>
    </div>
  );
}
