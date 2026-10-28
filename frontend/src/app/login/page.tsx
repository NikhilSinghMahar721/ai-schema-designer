import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../features/auth/components/LoginForm';

export const metadata = {
  title: 'Sign In — AI Schema Designer',
  description: 'Sign in to access your saved database schemas',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          <span>←</span> Back to Studio
        </Link>
      </div>

      <div className="my-auto py-12">
        <LoginForm />
      </div>

      <div className="text-center text-slate-600 text-xs py-4">
        AI Schema Designer • Secure session via httpOnly cookies
      </div>
    </div>
  );
}
