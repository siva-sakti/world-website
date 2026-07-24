"use client";

import { useEffect } from "react";

// Graceful fallback for any route that throws — a calm message + a working retry,
// instead of a raw crash. (The error is logged to the console for diagnosis.)
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("route error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-500">
        That page hit a snag loading — your work is safe.
      </p>
      <button
        onClick={reset}
        className="mt-5 text-sm underline underline-offset-4 hover:no-underline"
      >
        try again
      </button>
    </main>
  );
}
