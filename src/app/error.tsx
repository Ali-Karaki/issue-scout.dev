"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="p-6 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm mb-4">
          {process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
