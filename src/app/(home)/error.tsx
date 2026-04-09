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
    <div className="poster-shell min-h-screen w-full overflow-x-hidden text-[#fff2fb]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-[#ff9953]/18 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute right-[-12%] top-52 h-72 w-72 rounded-full bg-[#57ebff]/12 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#ff5c9a]/14 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col px-3 pb-14 pt-5 sm:px-5 sm:pb-20 sm:pt-6">
        <section className="hero-panel grid max-w-3xl gap-5 rounded-[2rem] border border-white/10 p-6 shadow-[0_30px_80px_rgba(7,3,13,0.55)] sm:p-8">
          <span className="section-kicker">
            Spieltag-Atlas
          </span>
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-[#fff6d0] sm:text-5xl">
            Hier lief etwas ins Abseits
          </h1>
          <p className="max-w-2xl text-[#e3b7cf]">
            Die aktuellen Spieltagsdaten konnten gerade nicht geladen werden.
            Bitte versuche es in einem Moment erneut.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={reset}
              className="bg-[#ffb14a] text-[#1b0915] hover:bg-[#ffd66c]"
            >
              Erneut versuchen
            </Button>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-[#fff2fb] hover:bg-white/10 hover:text-[#fff6d0]"
              onClick={() => window.location.reload()}
            >
              Seite neu laden
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
