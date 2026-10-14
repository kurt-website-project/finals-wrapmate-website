"use client";

import { useLoading } from "./loading-provider";

/**
 * Floating loading indicator pinned to the top-right of the viewport.
 * Shows a static WrapMate logo inside a rotating ring, a thin indeterminate
 * progress bar, and a small "Working…" label. Fades in/out. Theme-aware.
 */
export function LoadingIndicator() {
  const { loading } = useLoading();

  return (
    <div
      className={`wm-loader ${loading ? "wm-loader-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!loading}
    >
      <div className="wm-loader-row">
        <span className="wm-loader-ring">
          <img
            src="/logo-mark.png"
            alt=""
            className="wm-loader-logo"
            aria-hidden="true"
          />
        </span>
        <span className="wm-loader-text">Working…</span>
      </div>
      <div className="wm-loader-bar">
        <span className="wm-loader-bar-fill" />
      </div>
    </div>
  );
}

LoadingIndicator.displayName = "LoadingIndicator";
