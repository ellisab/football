import type { LeagueKey } from "@footballleagues/core/leagues";
import {
  createMatchPresentation,
  getBerlinDateKey,
  getMatchKickoffTimestamp,
  getMatchPresentationScore,
  getMatchPresentationStatus,
  isMatchOnBerlinDate,
} from "@footballleagues/core/matches";
import type {
  ApiMatch,
  ApiTableRow,
  ApiTeam,
} from "@footballleagues/core/openligadb";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";

export type CompetitionMatch = {
  competition: WebCompetitionViewModel;
  match: ApiMatch;
};

type MatchStatus = "finished" | "live" | "upcoming" | "unknown";

export type TeamSummary = {
  competitions: Array<{
    label: string;
    league: LeagueKey;
    season: number;
  }>;
  iconUrl?: string;
  id: string;
  name: string;
  nextMatch?: CompetitionMatch;
  upcomingMatches: CompetitionMatch[];
  recentMatches: CompetitionMatch[];
  tablePosition?: {
    points?: number;
    position: number;
  };
};

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});
const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

export const getMatchTime = (match: ApiMatch) => {
  return getMatchKickoffTimestamp(match) ?? Number.MAX_SAFE_INTEGER;
};

const getMatchIdentity = (match: ApiMatch) => {
  return [
    match.matchID,
    match.matchDateTimeUTC ?? match.matchDateTime,
    match.team1?.teamId ?? match.team1?.teamName,
    match.team2?.teamId ?? match.team2?.teamName,
  ]
    .filter(Boolean)
    .join("-");
};

export const getTeamLabel = (team: ApiMatch["team1"], fallback: string) => {
  return team?.teamName ?? team?.shortName ?? fallback;
};

export const getVenueLabel = (match: ApiMatch) => {
  const stadium = match.location?.locationStadium;
  const city = match.location?.locationCity;

  if (stadium && city) return `${stadium}, ${city}`;
  return stadium ?? city;
};

export const formatMatchTime = (match: ApiMatch) => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return "offen";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "offen";

  return timeFormatter.format(date);
};

export const formatMatchDate = (match: ApiMatch) => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return "Datum offen";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Datum offen";

  return dateFormatter.format(date);
};

export const getMatchScore = (match: ApiMatch) => {
  return getMatchPresentationScore(match).label;
};

export const getMatchStatus = (
  match: ApiMatch,
  now: Date = new Date(),
): MatchStatus => {
  const status = getMatchPresentationStatus(match, now);

  if (status === "finished") return "finished";
  if (status === "live-estimate") return "live";
  if (status === "scheduled") return "upcoming";
  return "unknown";
};

export const getMatchStatusLabel = (match: ApiMatch, now?: Date) => {
  const presentation = createMatchPresentation(match, { now });
  return presentation.statusLabel;
};

export const getMatchScreenReaderLabel = (match: ApiMatch, now?: Date) => {
  return createMatchPresentation(match, { now }).screenReaderLabel;
};

export const getCompetitionMatches = (
  competition: WebCompetitionViewModel,
): ApiMatch[] => {
  const sectionMatches = competition.sections.flatMap((section) => {
    if (section.renderKind === "matches") return section.items;
    if (section.renderKind === "ties") {
      return section.items.flatMap((tie) => tie.matches);
    }

    return [];
  });
  const bracketMatches = competition.bracketMatches.flatMap(
    (round) => round.matches,
  );
  return [...sectionMatches, ...bracketMatches];
};

export const getVisibleCompetitions = (
  data: WebCompetitionViewModel & {
    competitions?: WebCompetitionViewModel[];
    isOverview?: boolean;
  },
) => {
  return data.isOverview && data.competitions?.length
    ? data.competitions
    : [data];
};

export const getTodayCompetitionMatches = ({
  competitions,
  date = new Date(),
}: {
  competitions: WebCompetitionViewModel[];
  date?: Date;
}): CompetitionMatch[] => {
  const dateKey = getBerlinDateKey(date) ?? "";
  if (!dateKey) return [];

  return sortCompetitionMatches(
    collectUniqueCompetitionMatches(competitions, (match) =>
      isMatchOnBerlinDate(match, dateKey),
    ),
  );
};

export const getAllCompetitionMatches = (
  competitions: WebCompetitionViewModel[],
): CompetitionMatch[] =>
  sortCompetitionMatches(collectUniqueCompetitionMatches(competitions));

const collectUniqueCompetitionMatches = (
  competitions: WebCompetitionViewModel[],
  includeMatch?: (match: ApiMatch) => boolean,
): CompetitionMatch[] => {
  const seen = new Set<string>();
  const matches: CompetitionMatch[] = [];

  for (const competition of competitions) {
    for (const match of getCompetitionMatches(competition)) {
      if (includeMatch && !includeMatch(match)) continue;

      const identity = `${competition.resolvedLeague}-${getMatchIdentity(match)}`;
      if (seen.has(identity)) continue;

      seen.add(identity);
      matches.push({ competition, match });
    }
  }

  return matches;
};

const sortCompetitionMatches = (matches: CompetitionMatch[]) => {
  if (matches.length < 2) return matches;

  const now = new Date();
  const ranks: Record<MatchStatus, number> = {
    live: 0,
    upcoming: 1,
    unknown: 2,
    finished: 3,
  };
  return matches
    .map((item) => ({
      item,
      rank: ranks[getMatchStatus(item.match, now)],
      kickoff: getMatchTime(item.match),
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.kickoff - b.kickoff ||
        a.item.competition.leagueLabel.localeCompare(
          b.item.competition.leagueLabel,
        ),
    )
    .map(({ item }) => item);
};

export const getStatusCounts = (matches: CompetitionMatch[]) => {
  return matches.reduce(
    (counts, item) => {
      counts[getMatchStatus(item.match)] += 1;
      return counts;
    },
    {
      finished: 0,
      live: 0,
      unknown: 0,
      upcoming: 0,
    } satisfies Record<MatchStatus, number>,
  );
};

export const hasCompetitionTable = (competition: WebCompetitionViewModel) => {
  return competition.hasTable;
};

const normalizeTeamId = (value: string) => {
  return encodeURIComponent(
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  );
};

export const getTeamId = (team?: ApiTeam | ApiTableRow) => {
  const numericId =
    "teamId" in (team ?? {})
      ? (team as ApiTeam).teamId
      : (team as ApiTableRow)?.teamInfoId;
  const name = team?.teamName;

  if (typeof numericId === "number") return String(numericId);
  if (name) return normalizeTeamId(name);
  return "team";
};

export const findMatchById = (
  competitions: WebCompetitionViewModel[],
  matchId: string,
) => {
  return sortCompetitionMatches(
    collectUniqueCompetitionMatches(competitions).filter(
      ({ match }) => String(match.matchID) === matchId,
    ),
  )[0];
};

export const collectTeams = (
  competitions: WebCompetitionViewModel[],
  allMatches: readonly CompetitionMatch[] = getAllCompetitionMatches(
    competitions,
  ),
): TeamSummary[] => {
  const teams = new Map<
    string,
    {
      summary: TeamSummary;
      leagues: Set<LeagueKey>;
      recentIds: Set<string>;
      upcomingIds: Set<string>;
      nextTime: number;
    }
  >();
  const matchTimes = new Map<CompetitionMatch, number>();
  const now = new Date();

  const upsertTeam = ({
    competition,
    iconUrl,
    id,
    name,
    tablePosition,
  }: {
    competition: WebCompetitionViewModel;
    iconUrl?: string;
    id: string;
    name: string;
    tablePosition?: TeamSummary["tablePosition"];
  }) => {
    let entry = teams.get(id);
    if (!entry) {
      entry = {
        summary: {
          competitions: [],
          iconUrl,
          id,
          name,
          recentMatches: [],
          upcomingMatches: [],
        },
        leagues: new Set(),
        recentIds: new Set(),
        upcomingIds: new Set(),
        nextTime: Number.POSITIVE_INFINITY,
      };
      teams.set(id, entry);
    }
    const { summary, leagues } = entry;

    summary.iconUrl ??= iconUrl;
    if (!leagues.has(competition.resolvedLeague)) {
      leagues.add(competition.resolvedLeague);
      summary.competitions.push({
        label: competition.leagueLabel,
        league: competition.resolvedLeague,
        season: competition.resolvedSeason,
      });
    }

    if (tablePosition) summary.tablePosition ??= tablePosition;
    return entry;
  };

  for (const competition of competitions) {
    const table = competition.sections.find(
      (section) => section.renderKind === "table",
    );
    if (table?.renderKind === "table") {
      table.items.forEach((row, index) => {
        upsertTeam({
          competition,
          iconUrl: row.teamIconUrl,
          id: getTeamId(row),
          name: row.teamName ?? row.shortName ?? "Team",
          tablePosition: {
            points: row.points,
            position: index + 1,
          },
        });
      });
    }
  }

  for (const item of allMatches) {
    const status = getMatchStatus(item.match, now);
    const identity = getMatchIdentity(item.match);
    const kickoff = getMatchTime(item.match);
    matchTimes.set(item, kickoff);
    for (const team of [item.match.team1, item.match.team2]) {
      if (!team) continue;
      const entry = upsertTeam({
        competition: item.competition,
        iconUrl: team.teamIconUrl,
        id: getTeamId(team),
        name: getTeamLabel(team, "Team"),
      });
      const { summary, recentIds, upcomingIds } = entry;
      if (status === "finished" && !recentIds.has(identity)) {
        recentIds.add(identity);
        summary.recentMatches.push(item);
      } else if (status === "live" || status === "upcoming") {
        if (!upcomingIds.has(identity)) {
          upcomingIds.add(identity);
          summary.upcomingMatches.push(item);
        }
        if (kickoff <= entry.nextTime) {
          entry.nextTime = kickoff;
          summary.nextMatch = item;
        }
      }
    }
  }

  for (const { summary: team } of teams.values()) {
    team.recentMatches.sort((a, b) => matchTimes.get(b)! - matchTimes.get(a)!);
    team.upcomingMatches.sort(
      (a, b) => matchTimes.get(a)! - matchTimes.get(b)!,
    );
  }

  return [...teams.values()]
    .map(({ summary }) => summary)
    .sort((a, b) => {
      const aPosition = a.tablePosition?.position ?? Number.MAX_SAFE_INTEGER;
      const bPosition = b.tablePosition?.position ?? Number.MAX_SAFE_INTEGER;
      if (aPosition !== bPosition) return aPosition - bPosition;

      return a.name.localeCompare(b.name);
    });
};
