"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      console.error("Error boundary caught:", error);
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#050113] to-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 text-center"
      >
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-white/60">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-400 cursor-pointer">
                  Stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-red-300/80 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-white/90 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-white active:scale-95"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/40 active:scale-95"
          >
            Go home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

