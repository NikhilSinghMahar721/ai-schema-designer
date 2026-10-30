'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSchemaStore } from '../store/schema.store';
import { copySqlToClipboard, downloadSqlFile, downloadJsonFile } from '../../../lib/exportUtils';

interface ActionsMenuProps {
  onOpenSqlDrawer: () => void;
  onOpenPrompt?: () => void;
  onShowToast: (message: string) => void;
}

export function ActionsMenu({
  onOpenSqlDrawer,
  onOpenPrompt,
  onShowToast,
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schema, clearSchema, loadSample, importJson } = useSchemaStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async (dialect: 'postgresql' | 'mysql') => {
    setIsOpen(false);
    const success = await copySqlToClipboard(schema, dialect);
    if (success) {
      onShowToast(`Copied ${dialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'} SQL to clipboard!`);
    } else {
      onShowToast('Failed to copy to clipboard.');
    }
  };

  const handleDownload = (dialect: 'postgresql' | 'mysql') => {
    setIsOpen(false);
    downloadSqlFile(schema, dialect);
    onShowToast(`Downloaded ${dialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'} .sql script`);
  };

  const handleExportJson = () => {
    setIsOpen(false);
    downloadJsonFile(schema);
    onShowToast('Exported schema.json file');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = importJson(content);
        if (res.success) {
          onShowToast('Schema imported successfully!');
        } else {
          onShowToast(res.error || 'Failed to import JSON schema.');
        }
      } catch {
        onShowToast('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJsonFile}
        accept=".json"
        className="hidden"
      />

      {/* Three dots button */}
      <button
        type="button"
        title="More actions & export"
        aria-label="More options and export menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 z-50 text-xs font-sans">
          <div className="px-3 py-1.5 border-b border-zinc-800 text-[10px] uppercase font-mono font-semibold text-zinc-500">
            Export & Actions
          </div>

          {/* Copy Section */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleCopy('postgresql')}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy PostgreSQL SQL</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy('mysql')}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy MySQL SQL</span>
            </button>
          </div>

          <div className="border-t border-zinc-800 my-1" />

          {/* Download File Section */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleDownload('postgresql')}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export to PostgreSQL (.sql)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('mysql')}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export to MySQL (.sql)</span>
            </button>
          </div>

          <div className="border-t border-zinc-800 my-1" />

          {/* Full Viewer Drawer */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSqlDrawer();
              }}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Open SQL Viewer Drawer</span>
            </button>
          </div>

          <div className="border-t border-zinc-800 my-1" />

          {/* JSON File Backup */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Schema JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Schema JSON</span>
            </button>
          </div>

          <div className="border-t border-zinc-800 my-1" />

          {/* Board Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                loadSample();
                onShowToast('Loaded sample e-commerce schema');
              }}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Load Sample Schema</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (window.confirm('Clear all tables from the canvas?')) {
                  clearSchema();
                  onShowToast('Canvas cleared');
                }
              }}
              className="w-full text-left px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Board</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
