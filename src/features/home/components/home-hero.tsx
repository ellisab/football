import { ArrowRight, Sparkles } from "lucide-react";

export function HomeHero({
  hasTable,
  primaryHref,
  secondaryHref,
}: {
  hasTable: boolean;
  primaryHref: string;
  secondaryHref: string;
}) {
  const showSecondaryAction = secondaryHref !== primaryHref;

  return (
    <section className="hero-panel overflow-hidden rounded-[2.3rem] border border-white/10">
      <div className="grid gap-8 px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.32em] text-[#ffe38c]">
              <Sparkles className="h-4 w-4 text-[#ffd66c]" />
              spieltag
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(92deg,#fff6d0_0%,#ffd66c_38%,#ff9f63_100%)] px-5 py-3 text-sm font-semibold text-[#1b0915] shadow-[0_18px_34px_rgba(255,153,83,0.26)] transition-transform hover:-translate-y-0.5"
            >
              Zu den Spielen
              <ArrowRight className="h-4 w-4" />
            </a>
            {showSecondaryAction ? (
              <a
                href={secondaryHref}
                className="poster-surface inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#fff2fb] transition-colors hover:bg-white/10"
              >
                {hasTable ? "Zur Tabelle" : "Zum Ueberblick"}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
