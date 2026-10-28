'use client';

/**
 * ErrorBanner.tsx — Reusable friendly error banner.
 * Shows status-code-aware copy for common API errors:
 *   401 Unauthorized  → sign in prompt
 *   403 Forbidden     → access denied
 *   404 Not Found     → not found message
 *   409 Conflict      → conflict message
 *   429 Rate Limited  → try again later + retry hint
 *   5xx / other       → generic friendly message
 *
 * Accepts an optional `statusCode` to tailor the message, and `onDismiss`
 * to allow the user to close the banner.
 */

import React from 'react';

interface ErrorBannerProps {
  error: string | null;
  statusCode?: number | null;
  onDismiss?: () => void;
  className?: string;
}

function friendlyMessage(error: string, statusCode?: number | null): string {
  switch (statusCode) {
    case 401:
      return 'You need to be signed in to do that. Please sign in and try again.';
    case 403:
      return 'You are not allowed to perform this action.';
    case 404:
      return 'The requested item could not be found. It may have been deleted or moved.';
    case 409:
      return 'This action conflicts with the current state. Please try again.';
    case 429:
      return 'Too many requests — please wait a moment before trying again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'The service is temporarily unavailable. Please try again shortly.';
    default:
      return error || 'Something went wrong. Please try again.';
  }
}

export function ErrorBanner({
  error,
  statusCode,
  onDismiss,
  className = '',
}: ErrorBannerProps) {
  if (!error) return null;

  const isRateLimited = statusCode === 429;
  const isUnauthorized = statusCode === 401;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-3.5 rounded-lg border text-xs leading-relaxed mb-3 flex items-start gap-2 ${
        isRateLimited
          ? 'bg-amber-950/50 border-amber-800/80 text-amber-200'
          : isUnauthorized
            ? 'bg-blue-950/50 border-blue-800/80 text-blue-200'
            : 'bg-rose-950/50 border-rose-800/80 text-rose-200'
      } ${className}`}
    >
      <span className="shrink-0 mt-0.5">
        {isRateLimited ? '⏳' : isUnauthorized ? '🔐' : '⚠️'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs mb-0.5 flex items-center gap-1">
          {isRateLimited ? (
            <>
              <span className="text-amber-300">Rate Limited</span>
            </>
          ) : isUnauthorized ? (
            <>
              <span className="text-blue-300">Sign In Required</span>
            </>
          ) : (
            <>
              <span className="text-rose-300">Error</span>
            </>
          )}
        </div>
        <p className="text-xs/5">{friendlyMessage(error, statusCode)}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 p-1 text-xs hover:opacity-70 transition-opacity rounded"
        >
          ✕
        </button>
      )}
    </div>
  );
}