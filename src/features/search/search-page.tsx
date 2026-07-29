import { getCompetitionMeta } from "@/features/football/competition-meta";
import { PageIntro } from "@/features/football/components/product-ui";
import {
  collectTeams,
  getAllCompetitionMatches,
  getTeamLabel,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import type { WebHomeViewModel } from "@/features/home/presenter/home-view-model";
import type { SearchResultItem } from "@/features/search";
import { SearchExperience } from "@/features/search";

export function buildSearchItems(data: WebHomeViewModel): SearchResultItem[] {
  const competitions = getVisibleCompetitions(data);
  const competitionItems: SearchResultItem[] = competitions.map(
    (competition) => {
      const meta = getCompetitionMeta(competition.resolvedLeague);
      return {
        id: competition.resolvedLeague,
        kind: "competition",
        label: meta.label,
        href: `${meta.href}?season=${competition.resolvedSeason}`,
        description: `${meta.region} · Saison ${competition.resolvedSeason}`,
        aliases: [meta.shortLabel, competition.leagueLabel],
        keywords: [meta.region, meta.category],
      };
    },
  );
  const teamItems: SearchResultItem[] = collectTeams(competitions).map(
    (team) => ({
      id: team.id,
      kind: "team",
      label: team.name,
      href: `/teams/${team.id}`,
      description: team.competitions.map((entry) => entry.label).join(" · "),
    }),
  );
  const matchItems: SearchResultItem[] = getAllCompetitionMatches(competitions)
    .filter((item) => item.match.matchID)
    .map((item) => ({
      id: String(item.match.matchID),
      kind: "match",
      label: `${getTeamLabel(item.match.team1, "Offen")} gegen ${getTeamLabel(item.match.team2, "Offen")}`,
      href: `/matches/${item.match.matchID}`,
      description: item.competition.leagueLabel,
      keywords: [item.match.group?.groupName ?? ""],
    }));
  const matchdayItems: SearchResultItem[] = competitions.flatMap(
    (competition) => {
      const meta = getCompetitionMeta(competition.resolvedLeague);
      return competition.availableGroups
        .filter((group) => typeof group.groupOrderID === "number")
        .map((group) => ({
          id: `${competition.resolvedLeague}-${competition.resolvedSeason}-${group.groupOrderID}`,
          kind: "matchday" as const,
          label:
            group.groupName?.trim() ||
            `${group.groupOrderID as number}. Spieltag`,
          href: `${meta.href}?season=${competition.resolvedSeason}&matchday=${group.groupOrderID}`,
          description: `${meta.label} · Saison ${competition.resolvedSeason}`,
          keywords: [meta.shortLabel],
        }));
    },
  );

  const seen = new Set<string>();
  return [
    ...competitionItems,
    ...teamItems,
    ...matchItems,
    ...matchdayItems,
  ].filter((item) => {
    const key = `${item.kind}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SearchPageView({
  data,
  initialQuery,
}: {
  data: WebHomeViewModel;
  initialQuery: string;
}) {
  return (
    <div className="page-shell">
      <div className="content-column">
        <PageIntro
          eyebrow="Direktzugriff"
          title="Suchen"
          description="Finde Teams, Wettbewerbe, Spiele und Spieltage – fehlertolerant und ohne versteckte Filter."
        />
        <div className="search-surface">
          <SearchExperience
            autoFocus
            initialQuery={initialQuery}
            items={buildSearchItems(data)}
            resultLimit={24}
          />
        </div>
      </div>
    </div>
  );
}
