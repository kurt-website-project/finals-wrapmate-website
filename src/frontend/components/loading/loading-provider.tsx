"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Global, app-wide loading indicator.
 *
 * Wrap the app in <LoadingProvider> and call `showLoading()` from anywhere
 * (via the useLoading hook) when an action happens. Because WrapMate's actions
 * are instant (localStorage, no network), the loader stays visible for a short
 * deliberate duration so the feedback is actually seen.
 */

type LoadingContextValue = {
  loading: boolean;
  /** Flash the loader for a short, deliberate duration (default 700ms). */
  showLoading: (durationMs?: number) => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

const DEFAULT_DURATION = 700;

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLoading = useCallback((durationMs: number = DEFAULT_DURATION) => {
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      timerRef.current = null;
    }, durationMs);
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, showLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    // Safe no-op fallback if used outside the provider.
    return { loading: false, showLoading: () => {} };
  }
  return ctx;
}
