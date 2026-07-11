import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchdaySnapshot } from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import { CompetitionView } from "@/features/competitions/components/competition-view";
import {
  getCompetitionMeta,
  getLeagueKeyFromSlug,
} from "@/features/football/competition-meta";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

const MATCHDAY_REQUEST_TIMEOUT_MS = 6_000;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = getLeagueKeyFromSlug(slug);
  if (!league) return { title: "Wettbewerb" };
  const meta = getCompetitionMeta(league);
  return { title: meta.label, description: meta.description };
}

const parseMatchday = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const withMatchdayTimeout = <T,>(promise: Promise<T>) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error("Matchday request timed out")),
      MATCHDAY_REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
};

const getSectionMatches = (
  data: Awaited<ReturnType<typeof getHomePageData>>
) => {
  const section = data.sections.find((entry) => entry.key === "matchday");
  if (!section || section.renderKind === "table") return [];
  return section.renderKind === "matches"
    ? section.items
    : section.items.flatMap((tie) => tie.matches);
};

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    matchday?: string;
    season?: string;
    scope?: string;
    view?: string;
  }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const league = getLeagueKeyFromSlug(slug);
  if (!league) notFound();

  const data = await getHomePageData({
    league,
    season: query.season,
  });

  const currentSection = data.sections.find((entry) => entry.key === "matchday");
  const currentMatchday =
    currentSection && currentSection.renderKind !== "table"
      ? currentSection.groupOrderID
      : undefined;
  const requestedMatchday = parseMatchday(query.matchday);
  const selectedMatchday = requestedMatchday ?? currentMatchday;
  const view = query.view === "standings" ? "standings" : "matches";
  const scope =
    query.scope === "fixtures" || query.scope === "results"
      ? query.scope
      : "all";
  let matches = getSectionMatches(data);
  let matchdayError: string | undefined;

  if (
    view === "matches" &&
    selectedMatchday &&
    selectedMatchday !== currentMatchday
  ) {
    try {
      const snapshot = await withMatchdayTimeout(
        getMatchdaySnapshot(
          {
            group: selectedMatchday,
            league,
            season: String(data.resolvedSeason),
          },
          {
            requestOptions: {
              next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
            },
          }
        )
      );
      matches = snapshot.matches;
    } catch {
      matches = [];
      matchdayError =
        "Die gewählte Runde konnte nicht geladen werden. Sie ist möglicherweise für diese Saison nicht verfügbar.";
    }
  }

  return (
    <CompetitionView
      competition={data}
      currentMatchday={currentMatchday}
      matches={matches}
      matchdayError={matchdayError}
      selectedMatchday={selectedMatchday}
      scope={scope}
      view={view}
    />
  );
}
