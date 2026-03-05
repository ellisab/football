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
    <div className="app-shell min-h-screen text-[#14161b]">
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 pb-20 pt-16 sm:px-10">
        <span className="text-xs uppercase tracking-[0.3em] text-[#5b5f68]">Matchday Atlas</span>
        <h1 className="font-display text-4xl uppercase tracking-[0.2em]">Something went offside</h1>
        <p className="text-[#4d515a]">
          We couldn’t load the latest matchday data right now. Try again in a
          moment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={reset}
            className="bg-[#d5001d] text-white hover:bg-[#bd0018]"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            className="border-[#d5d8e0] text-[#14161b] hover:bg-[#f2f3f7]"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </main>
    </div>
  );
}
