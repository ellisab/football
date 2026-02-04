"use client";

import { useEffect } from "react";
import { Button } from "@footballleagues/ui/button";

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
    <div className="app-shell min-h-screen text-slate-900 dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 pb-20 pt-16 sm:px-10">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Matchday Atlas</span>
        <h1 className="font-display text-4xl uppercase tracking-[0.2em]">Something went offside</h1>
        <p className="text-slate-700 dark:text-slate-200/80">
          We couldn’t load the latest matchday data right now. Try again in a
          moment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={reset}
            className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-900 hover:bg-slate-200/80 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </main>
    </div>
  );
}
