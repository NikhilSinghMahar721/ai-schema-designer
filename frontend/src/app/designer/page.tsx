'use client';

/**
 * Main Designer Studio Page.
 * Full visual workspace with:
 * 1. Unified top toolbar & navigation.
 * 2. Left-side conversational AI Chat Panel with persistent message stream.
 * 3. Expansive interactive ER Diagram canvas (blank or active tables).
 * 4. Contextual overlay Inspector and slide-over SQL drawer.
 * 5. Three-dots actions & export menu.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DiagramCanvas } from '../../features/designer/components/DiagramCanvas';
import { AiChatPanel } from '../../features/designer/components/AiChatPanel';
import { SqlDrawer } from '../../features/designer/components/SqlDrawer';
import { ActionsMenu } from '../../features/designer/components/ActionsMenu';
import { UserMenu } from '../../features/auth/components/UserMenu';
import { SaveDialog } from '../../features/saved-schemas/components/SaveDialog';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useSchemaStore } from '../../features/designer/store/schema.store';
import { useIsMounted } from '../../lib/useIsMounted';

export default function DesignerPage() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isSqlDrawerOpen, setIsSqlDrawerOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mounted = useIsMounted();
  const { user, isInitialLoading, fetchCurrentUser } = useAuthStore();
  const {
    schema,
    validationErrors,
    addTable,
    recalculateAutoLayout,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSchemaStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const totalTables = schema.tables.length;
  const totalColumns = schema.tables.reduce((acc, t) => acc + t.columns.length, 0);
  const totalRelationships = schema.relationships.length;
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-zinc-700/90 text-zinc-100 text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Unauthenticated Access Gate */}
      {mounted && !isInitialLoading && !user && (
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

      {/* Unified Top Navigation & Controls Toolbar */}
      <header className="h-13 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left Side: Brand & Canvas Creation Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="h-6 w-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-[11px] tracking-tighter">
              DB
            </div>
            <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">
              AI Schema Designer
            </span>
          </Link>
          <span className="text-zinc-600 hidden md:inline">/</span>
          <span className="text-[11px] text-zinc-400 font-mono hidden md:inline-block">
            workspace
          </span>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Add Table */}
          <button
            type="button"
            onClick={() => {
              addTable();
              setIsInspectorOpen(true);
            }}
            className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Table</span>
          </button>

          {/* Auto Layout */}
          <button
            type="button"
            onClick={recalculateAutoLayout}
            title="Auto-organize table positions"
            className="py-1.5 px-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span className="hidden lg:inline">Auto Layout</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-800/80 rounded-lg border border-zinc-700/80 p-0.5">
            <button
              type="button"
              disabled={!canUndo()}
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!canRedo()}
              onClick={redo}
              title="Redo (Ctrl+Y)"
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          {/* Counts Badge */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70 font-mono text-[11px]">
              {totalTables} {totalTables === 1 ? 'Table' : 'Tables'}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70 font-mono text-[11px]">
              {totalColumns} Cols
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70 font-mono text-[11px]">
              {totalRelationships} Relations
            </span>
          </div>
        </div>

        {/* Right Side: AI Chat Toggle, Inspector, Save, Three Dots Menu & User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          {/* Validation Status */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            title="Click to inspect validation errors"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasErrors
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-950/60'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasErrors ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="hidden sm:inline">
              {hasErrors
                ? `${validationErrors.length} ${
                    validationErrors.length === 1 ? 'Issue' : 'Issues'
                  }`
                : 'Valid'}
            </span>
          </button>

          {/* AI Chat Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`py-1.5 px-2.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              isChatOpen
                ? 'bg-blue-950/50 border-blue-700/80 text-blue-200'
                : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-white'
            }`}
            title="Toggle AI chat conversation"
          >
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          {/* Contextual Inspector Toggle */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`py-1.5 px-2.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              isInspectorOpen
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden md:inline">Inspector</span>
          </button>

          {/* Save Schema */}
          <button
            type="button"
            onClick={() => setIsSaveOpen(true)}
            className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Three Dots Menu for Export (PostgreSQL, MySQL, JSON, SQL Drawer, etc.) */}
          <ActionsMenu
            onOpenSqlDrawer={() => setIsSqlDrawerOpen(true)}
            onOpenPrompt={() => setIsChatOpen(true)}
            onShowToast={showToast}
          />

          <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

          {/* My Schemas (for authenticated users) */}
          {user && (
            <Link
              href="/schemas"
              className="py-1.5 px-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors text-xs hidden sm:flex"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>My Schemas</span>
            </Link>
          )}

          <UserMenu />
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Conversational AI Chat Stream */}
        {isChatOpen && (
          <aside className="w-80 md:w-96 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0 z-10 animate-in slide-in-from-left duration-150">
            <AiChatPanel
              onClose={() => setIsChatOpen(false)}
              onShowToast={showToast}
            />
          </aside>
        )}

        {/* Right Side: Interactive ER Diagram Canvas */}
        <section className="flex-1 relative overflow-hidden flex flex-col">
          <DiagramCanvas
            isInspectorOpen={isInspectorOpen}
            onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
            onOpenPrompt={() => setIsChatOpen(true)}
          />

          {/* Slide-over SQL Viewer Drawer */}
          <SqlDrawer
            isOpen={isSqlDrawerOpen}
            onClose={() => setIsSqlDrawerOpen(false)}
            onShowToast={showToast}
          />

          {/* Save Schema Dialog */}
          <SaveDialog
            isOpen={isSaveOpen}
            onClose={() => setIsSaveOpen(false)}
          />
        </section>
      </main>
    </div>
  );
}
