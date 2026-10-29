import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../features/auth/components/LoginForm';

export const metadata = {
  title: 'Sign In — DB Architect',
  description: 'Sign in to access your saved database schemas and studio workspace',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
        >
          <span>←</span> Back to Home
        </Link>
      </div>

      <div className="my-auto py-12">
        <LoginForm />
      </div>

      <div className="text-center text-zinc-600 text-xs py-4 font-mono">
        DB Architect • Secure sessions via httpOnly cookies
      </div>
    </div>
  );
}
