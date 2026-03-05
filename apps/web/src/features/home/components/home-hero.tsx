import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import { LocalKickoff } from "@/features/matchday/components/local-kickoff";

export function HomeHero({
  heroKicker,
  leagueLabel,
  resolvedSeason,
  matchdayNumber,
  featuredMatch,
}: {
  heroKicker: string;
  leagueLabel: string;
  resolvedSeason: number;
  matchdayNumber: string | null;
  featuredMatch?: ApiMatch;
}) {
  const featuredResult = featuredMatch ? getFinalResult(featuredMatch) : null;
  const featuredScore = featuredResult
    ? `${featuredResult.pointsTeam1 ?? 0} - ${featuredResult.pointsTeam2 ?? 0}`
    : "- : -";

  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
      {matchdayNumber ? (
        <div className="pointer-events-none absolute right-0 top-0 text-[9rem] font-black leading-none text-[#3dffa014] sm:text-[11rem]">
          {matchdayNumber}
        </div>
      ) : null}

      <div className="relative z-10 grid gap-6">
        <div className="flex flex-wrap gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-[#3dffa080] bg-[#1a3a2a] px-3 py-1 text-[#3dffa0]">
            {heroKicker}
          </span>
          <span className="rounded-full border border-[#2b303b] bg-[#13161d] px-3 py-1 text-[#9ca6ba]">
            {leagueLabel}
          </span>
          <span className="rounded-full border border-[#2b303b] bg-[#13161d] px-3 py-1 text-[#9ca6ba]">
            Season {resolvedSeason}
          </span>
        </div>

        <div className="grid gap-3">
          <h2 className="max-w-3xl text-5xl leading-[0.95] font-[var(--font-stadium-heading)] uppercase tracking-[0.04em] sm:text-6xl lg:text-7xl">
            Your Match Control
          </h2>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#222530] bg-[#13161d] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="text-center sm:text-left">
            <div className="text-xs uppercase tracking-[0.1em] text-[#9ca6ba]">Home</div>
            <div className="text-lg font-semibold">{featuredMatch?.team1?.teamName ?? "Mainz 05"}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-[var(--font-stadium-heading)] text-[#ffffff]">
              {featuredScore}
            </div>
            <div className="text-xs uppercase tracking-[0.12em] text-[#3dffa0]">
              <LocalKickoff
                value={featuredMatch?.matchDateTimeUTC ?? featuredMatch?.matchDateTime}
                fallback="Awaiting kickoff"
              />
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-xs uppercase tracking-[0.1em] text-[#9ca6ba]">Away</div>
            <div className="text-lg font-semibold">{featuredMatch?.team2?.teamName ?? "Hamburger SV"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
