'use client';

/**
 * Main Designer Page (works for guests, requirements.md §7 / FR-11).
 * Layout with three areas:
 * 1. Describe panel (left)
 * 2. Diagram canvas (center)
 * 3. SQL preview (right)
 */

import React, { useState } from 'react';
import { DescribePanel } from '../features/designer/components/DescribePanel';
import { DiagramCanvas } from '../features/designer/components/DiagramCanvas';
import { SqlPreview } from '../features/designer/components/SqlPreview';

type MobileTab = 'describe' | 'diagram' | 'sql';

export default function DesignerPage() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('diagram');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              ⚡
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              AI Schema Designer
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
            Guest Mode
          </span>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('describe')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'describe'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            Prompt
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('diagram')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'diagram'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            Diagram
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('sql')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              mobileTab === 'sql'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            SQL
          </button>
        </div>

        {/* Right Nav Utilities */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Export ready: <span className="text-emerald-400 font-mono">PostgreSQL</span> / <span className="text-amber-400 font-mono">MySQL</span>
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Docs & Help
          </a>
        </div>
      </header>

      {/* Main 3-Area Studio Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Area: Describe Panel */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] shrink-0 ${
            mobileTab === 'describe' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <DescribePanel />
        </div>

        {/* Center Area: Diagram Canvas */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobileTab === 'diagram' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <DiagramCanvas />
        </div>

        {/* Right Area: SQL Preview */}
        <div
          className={`w-full md:w-[360px] lg:w-[400px] shrink-0 ${
            mobileTab === 'sql' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <SqlPreview />
        </div>
      </main>
    </div>
  );
}
