'use client';

/**
 * Product Landing Page — Precision Dev-Tool Aesthetic.
 * Focuses on architectural substance, clear engineering value,
 * and high-contrast typography without generic AI-slop gradients or emojis.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../features/auth/store/auth.store';
import { UserMenu } from '../features/auth/components/UserMenu';

export default function LandingPage() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [activeDialect, setActiveDialect] = useState<'postgresql' | 'mysql'>('postgresql');

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-xs tracking-tighter">
                DB
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">
                AI Schema Designer
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
              <a href="#studio-preview" className="hover:text-zinc-200 transition-colors">
                Studio
              </a>
              <a href="#how-it-works" className="hover:text-zinc-200 transition-colors">
                How It Works
              </a>
              <a href="#capabilities" className="hover:text-zinc-200 transition-colors">
                Capabilities
              </a>
              <a href="#dialects" className="hover:text-zinc-200 transition-colors">
                PostgreSQL & MySQL
              </a>
              <a href="#privacy" className="hover:text-zinc-200 transition-colors">
                Security
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/designer"
                  className="px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors flex items-center gap-1"
                >
                  <span>Launch Studio</span>
                  <span>→</span>
                </Link>
                <div className="h-4 w-px bg-zinc-800" />
                <UserMenu />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-20 md:pt-28 md:pb-28 border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>AI-Powered Relational Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Design production databases with AI.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed mb-10 font-normal">
            Turn natural language into validated relational models, interactive entity-relationship diagrams, and deterministic PostgreSQL and MySQL DDL.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href={user ? '/designer' : '/register'}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group shadow-sm"
            >
              <span>{user ? 'Open Studio Workspace' : 'Start Designing Free'}</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <a
              href="#studio-preview"
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-colors text-center"
            >
              View Studio Demo
            </a>
          </div>

          {/* Clean Proof Points */}
          <div className="pt-8 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-zinc-400">
            <div>
              <span className="block text-white font-semibold text-sm mb-0.5">PostgreSQL & MySQL</span>
              <span>Native SQL compilation</span>
            </div>
            <div>
              <span className="block text-white font-semibold text-sm mb-0.5">Zero Data Retention</span>
              <span>Prompts never persisted</span>
            </div>
            <div>
              <span className="block text-white font-semibold text-sm mb-0.5">Circular FK Defense</span>
              <span>Automated 2-phase DDL</span>
            </div>
            <div>
              <span className="block text-white font-semibold text-sm mb-0.5">Free & Open Access</span>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Workspace Preview */}
      <section id="studio-preview" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            An architectural canvas for modern engineering.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Generate normalized schemas in seconds, inspect entity cards on a reactive graph, and export migration-ready SQL.
          </p>
        </div>

        {/* Studio Window Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="h-10 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">{'//'}</span>
              <span className="text-zinc-300 font-medium">schema-designer {'//'} workspace</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Model: Gemini 2.5 Flash</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
          </div>

          {/* 3-Column Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left: Input */}
            <div className="lg:col-span-3 p-5 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-between bg-zinc-950/60">
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-zinc-200">Requirements Prompt</span>
                  <span className="text-[11px] text-zinc-500 font-mono">140 / 2000</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed mb-4">
                  &quot;Design an e-commerce database with customers, orders, order items, product inventory, and customer addresses with foreign keys.&quot;
                </div>

                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-medium text-zinc-400 block font-mono">
                    TARGET DIALECT
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveDialect('postgresql')}
                      className={`py-1.5 px-3 rounded-md border text-center transition-colors cursor-pointer ${
                        activeDialect === 'postgresql'
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      PostgreSQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDialect('mysql')}
                      className={`py-1.5 px-3 rounded-md border text-center transition-colors cursor-pointer ${
                        activeDialect === 'mysql'
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      MySQL
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 leading-normal">
                  <span className="text-zinc-200 font-medium">Synthesis Output:</span> 4 tables, 17 columns, 3 foreign key constraints with CASCADE rules.
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <Link
                  href={user ? '/designer' : '/login'}
                  className="w-full py-2 px-3 rounded-lg bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{user ? 'Open Workspace' : 'Sign In to Generate'}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Center: ER Diagram Cards */}
            <div className="lg:col-span-6 p-6 bg-zinc-950 flex flex-col justify-between relative overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Table: customers */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono overflow-hidden">
                  <div className="p-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-zinc-100">customers</span>
                    <span className="text-[10px] text-zinc-500">3 cols</span>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-200">
                      <span>id</span>
                      <span className="text-blue-400 text-[10px]">PK UUID</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>email</span>
                      <span className="text-zinc-500 text-[10px]">VARCHAR(255)</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>created_at</span>
                      <span className="text-zinc-500 text-[10px]">TIMESTAMP</span>
                    </div>
                  </div>
                </div>

                {/* Table: orders */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono overflow-hidden">
                  <div className="p-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-zinc-100">orders</span>
                    <span className="text-[10px] text-zinc-500">4 cols</span>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-200">
                      <span>id</span>
                      <span className="text-blue-400 text-[10px]">PK UUID</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>customer_id</span>
                      <span className="text-amber-400 text-[10px]">FK customers</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>total_amount</span>
                      <span className="text-zinc-500 text-[10px]">DECIMAL(10,2)</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>status</span>
                      <span className="text-zinc-500 text-[10px]">VARCHAR(50)</span>
                    </div>
                  </div>
                </div>

                {/* Table: order_items */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono overflow-hidden">
                  <div className="p-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-zinc-100">order_items</span>
                    <span className="text-[10px] text-zinc-500">4 cols</span>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-200">
                      <span>id</span>
                      <span className="text-blue-400 text-[10px]">PK UUID</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>order_id</span>
                      <span className="text-amber-400 text-[10px]">FK orders</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>product_id</span>
                      <span className="text-amber-400 text-[10px]">FK products</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>quantity</span>
                      <span className="text-zinc-500 text-[10px]">INTEGER</span>
                    </div>
                  </div>
                </div>

                {/* Table: products */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono overflow-hidden">
                  <div className="p-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-zinc-100">products</span>
                    <span className="text-[10px] text-zinc-500">3 cols</span>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-200">
                      <span>id</span>
                      <span className="text-blue-400 text-[10px]">PK UUID</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>sku</span>
                      <span className="text-zinc-500 text-[10px]">VARCHAR(64)</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>unit_price</span>
                      <span className="text-zinc-500 text-[10px]">DECIMAL(10,2)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>Relational validation: Pass (0 errors)</span>
                <span>Handles: Drag to connect</span>
              </div>
            </div>

            {/* Right: Compiled SQL */}
            <div className="lg:col-span-3 p-5 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between bg-zinc-950/60 font-mono">
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-zinc-200">Compiled DDL</span>
                  <span className="text-[10px] text-zinc-400">{activeDialect.toUpperCase()}</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed overflow-x-auto">
                  {activeDialect === 'postgresql' ? (
                    <pre className="text-[11px] text-zinc-300 whitespace-pre">
                      {`CREATE TABLE "customers" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP
);

ALTER TABLE "orders"
  ADD CONSTRAINT "fk_orders_customer"
  FOREIGN KEY ("customer_id")
  REFERENCES "customers"("id")
  ON DELETE CASCADE;`}
                    </pre>
                  ) : (
                    <pre className="text-[11px] text-zinc-300 whitespace-pre">
                      {`CREATE TABLE \`customers\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`email\` VARCHAR(255) NOT NULL,
  \`created_at\` DATETIME
) ENGINE=InnoDB;

ALTER TABLE \`orders\`
  ADD CONSTRAINT \`fk_orders_customer\`
  FOREIGN KEY (\`customer_id\`)
  REFERENCES \`customers\`(\`id\`)
  ON DELETE CASCADE;`}
                    </pre>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Deterministic output</span>
                <span className="text-zinc-300">Copy / Export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-zinc-900 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Three-phase design pipeline
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Transform unstructured requirements into valid relational database definitions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 block mb-2">PHASE 1</span>
              <h3 className="text-sm font-semibold text-white mb-2">Natural Language Extraction</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Describe your requirements in plain English. The AI service decomposes requirements into entities, attributes, primary keys, and relations validated against strict Zod and semantic rules.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 block mb-2">PHASE 2</span>
              <h3 className="text-sm font-semibold text-white mb-2">Interactive Diagram Refinement</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag, arrange, and inspect tables on an infinite canvas. Add columns, toggle nullability or unique constraints, drag handles to create foreign keys, or request conversational AI modifications.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 block mb-2">PHASE 3</span>
              <h3 className="text-sm font-semibold text-white mb-2">Topological DDL Generation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compile clean DDL ordered by dependency graph. Circular foreign key references are automatically separated into deferred ALTER TABLE statements to guarantee error-free database execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-20 px-6 border-t border-zinc-900 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Core Engineering Principles
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Engineered with strict constraints to protect against corrupt schemas and invalid DDL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">DEPENDENCY SORTING</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Circular Reference Defense</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Detects circular dependency graphs and splits statements so foreign keys never fail during migration runs.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">SANITIZATION</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Strict DDL Quoting</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Table names, columns, and default literals are checked against SQL injection and reserved word registries.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">CANVAS ENGINE</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Reactive Node Graph</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Full pan and zoom, handle-to-handle relationship creation, undo/redo history, and automatic layout alignment.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">COMPILATION</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Dual-Dialect Generation</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Native PostgreSQL and MySQL DDL generators with dialect-appropriate auto-increments, timestamps, and UUID mappings.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">ISOLATION</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Cloud Schema Vault</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Save up to 50 relational schemas per user. Multi-tenant access controls ensure users cannot access other accounts.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">AUTHENTICATION</span>
            <h4 className="text-sm font-semibold text-white mb-1.5">Argon2id & httpOnly Sessions</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Session tokens are stored exclusively in httpOnly SameSite=Lax cookies with timing-attack-safe password verification.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Privacy Banner */}
      <section id="privacy" className="py-16 px-6 border-t border-zinc-900 bg-zinc-950/70">
        <div className="max-w-4xl mx-auto p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
          <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 font-mono text-sm shrink-0">
            SEC
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Zero Prompt Data Retention
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your architectural requirements prompts are processed ephemerally by the AI service and are never written to database tables or server logs. Only the schemas you explicitly save in your cloud account are stored.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 border-t border-zinc-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Ready to design your database?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8">
            Create an account or sign in to start generating diagrams and exporting SQL in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={user ? '/designer' : '/register'}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition-colors shadow-sm"
            >
              {user ? 'Open Studio Workspace →' : 'Create Free Account →'}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-zinc-300 font-medium">DB Architect</span> {'//'} Natural language to deterministic DDL
          </div>

          <div className="flex items-center gap-6">
            <Link href={user ? '/designer' : '/login'} className="hover:text-zinc-300 transition-colors">
              Studio
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-zinc-300 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
