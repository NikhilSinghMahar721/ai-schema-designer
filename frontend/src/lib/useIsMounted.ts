import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * useIsMounted — Idiomatic React 19 / Next.js hook to safely gate client-only
 * UI without triggering hydration mismatch or react-hooks/set-state-in-effect.
 *
 * During SSR and initial client hydration, returns false.
 * After client hydration is complete, returns true.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

