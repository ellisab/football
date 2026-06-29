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
    <div className="poster-shell min-h-screen w-full overflow-x-hidden text-[#f2f7f2]">
      <main className="relative z-10">
        <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#061512_0%,#071a17_42%,#030708_100%)]">
          <div
            aria-hidden
            className="atlas-hero-grid absolute inset-0 opacity-70"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_24%_34%,rgba(110, 234, 242,0.12),transparent_22%),radial-gradient(circle_at_72%_64%,rgba(216, 184, 106,0.14),transparent_18%),linear-gradient(90deg,rgba(4,12,16,0.92)_0%,rgba(4,12,16,0.74)_38%,rgba(4,12,16,0.52)_62%,rgba(4,12,16,0.9)_100%)]"
          />

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1240px] items-center px-4 pb-14 pt-20 sm:px-6 sm:pb-20 lg:px-10">
            <section className="grid max-w-3xl gap-5 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.72),rgba(8,17,22,0.9))] p-6 shadow-[0_24px_70px_rgba(2,9,12,0.26)] backdrop-blur-md sm:p-8">
              <span className="section-kicker">Spieltag</span>
              <h1 className="font-stadium-heading text-4xl uppercase tracking-[0.08em] text-[#f5edc9] sm:text-5xl">
            Hier lief etwas ins Abseits
              </h1>
              <p className="max-w-2xl text-[#b4c8c0]">
            Die aktuellen Spieltagsdaten konnten gerade nicht geladen werden.
            Bitte versuche es in einem Moment erneut.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={reset}
                  className="bg-[linear-gradient(94deg,#f5edc9_0%,#d8b86a_46%,#ffb45f_100%)] text-[#030708] hover:brightness-105"
                >
                  Erneut versuchen
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-[#f2f7f2] hover:bg-white/10 hover:text-[#f5edc9]"
                  onClick={() => window.location.reload()}
                >
                  Seite neu laden
                </Button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
