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
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(61,255,160,0.15)_0%,transparent_35%),linear-gradient(180deg,#0b0d12_0%,#11151e_100%)] text-[#f3f6fd]">
      <main className="mx-auto flex w-full max-w-[1220px] flex-col px-3 pb-14 pt-5 sm:px-5 sm:pb-20">
        <section className="grid max-w-3xl gap-5 rounded-[1.75rem] border border-[#222530] bg-[#12161f] p-6 shadow-[0_20px_60px_rgba(5,8,14,0.45)] sm:p-8">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
            Matchday Atlas
          </span>
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-[#ffffff] sm:text-5xl">
            Something went offside
          </h1>
          <p className="max-w-2xl text-[#9ca6ba]">
            We couldn’t load the latest matchday data right now. Try again in a
            moment.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={reset}
              className="bg-[#3dffa0] text-[#0c0e12] hover:bg-[#72ffbc]"
            >
              Try again
            </Button>
            <Button
              variant="outline"
              className="border-[#2a3441] bg-[#13161d] text-[#f3f6fd] hover:bg-[#161b26] hover:text-[#f3f6fd]"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
