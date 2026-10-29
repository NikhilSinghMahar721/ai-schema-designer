'use client';

/**
 * LoadingSkeleton.tsx — Reusable animated skeleton placeholder.
 * Used while content is loading to avoid layout shift and communicate
 * that data is being fetched.
 */

import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function LoadingSkeleton({
  className = '',
  width = '100%',
  height = '16px',
}: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-800/60 ${className}`}
      style={{ width, height }}
    />
  );
}

export function LoadingSkeletonLine({
  className = '',
  width = '60%',
}: LoadingSkeletonProps) {
  return (
    <LoadingSkeleton className={className} width={width} height="14px" />
  );
}

export function LoadingSkeletonBlock({
  className = '',
  width = '100%',
  height = '100px',
}: LoadingSkeletonProps) {
  return (
    <LoadingSkeleton className={className} width={width} height={height} />
  );
}
