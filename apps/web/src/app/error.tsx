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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(12,74,110,0.12),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(190,24,93,0.08),_transparent_40%),linear-gradient(135deg,_#0b1020,_#101827_40%,_#0f172a)] text-slate-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 pb-20 pt-16 sm:px-10">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-300">Matchday Atlas</span>
        <h1 className="font-display text-4xl uppercase tracking-[0.2em]">Something went offside</h1>
        <p className="text-slate-200/80">
          We couldn’t load the latest matchday data right now. Try again in a
          moment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={reset} className="bg-white text-slate-900 hover:bg-white/90">
            Try again
          </Button>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </main>
    </div>
  );
}
