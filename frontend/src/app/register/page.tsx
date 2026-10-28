import React from 'react';
import Link from 'next/link';
import { RegisterForm } from '../../features/auth/components/RegisterForm';

export const metadata = {
  title: 'Create Account — AI Schema Designer',
  description: 'Create an account to save and manage schemas in the cloud',
};

export default function RegisterPage() {
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
        <RegisterForm />
      </div>

      <div className="text-center text-slate-600 text-xs py-4">
        AI Schema Designer • Secure session via httpOnly cookies
      </div>
    </div>
  );
}
