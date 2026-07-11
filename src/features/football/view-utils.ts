import { LEAGUE_GROUPS, type LeagueKey } from "@footballleagues/core/leagues";
import {
  createMatchPresentation,
  getBerlinDateKey,
  getMatchKickoffTimestamp,
  getMatchPresentationScore,
  isMatchOnBerlinDate,
} from "@footballleagues/core/matches";
import {
  type ApiMatch,
  type ApiTableRow,
  type ApiTeam,
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
  recentMatch?: CompetitionMatch;
  upcomingMatches: CompetitionMatch[];
  recentMatches: CompetitionMatch[];
  tablePosition?: {
    competitionLabel: string;
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

export const getMatchIdentity = (match: ApiMatch) => {
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
  now: Date = new Date()
): MatchStatus => {
  const status = createMatchPresentation(match, { now }).status;

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
  competition: WebCompetitionViewModel
): ApiMatch[] => {
  const sectionMatches = competition.sections.flatMap((section) => {
    if (section.renderKind === "matches") return section.items;
    if (section.renderKind === "ties") {
      return section.items.flatMap((tie) => tie.matches);
    }

    return [];
  });
  const bracketMatches = competition.bracketMatches.flatMap((round) => round.matches);
  const worldCupMatches = competition.worldCup
    ? [
        ...competition.worldCup.groupSections.flatMap((section) => section.matches),
        ...competition.worldCup.knockoutRounds.flatMap((round) => round.matches),
      ]
    : [];

  return [...sectionMatches, ...bracketMatches, ...worldCupMatches];
};

export const getVisibleCompetitions = (data: WebCompetitionViewModel & {
  competitions?: WebCompetitionViewModel[];
  isOverview?: boolean;
}) => {
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
  const seen = new Set<string>();
  const matches: CompetitionMatch[] = [];

  if (!dateKey) return matches;

  for (const competition of competitions) {
    for (const match of getCompetitionMatches(competition)) {
      if (!isMatchOnBerlinDate(match, dateKey)) continue;

      const identity = `${competition.resolvedLeague}-${getMatchIdentity(match)}`;
      if (seen.has(identity)) continue;

      seen.add(identity);
      matches.push({ competition, match });
    }
  }

  return sortCompetitionMatches(matches);
};

export const getAllCompetitionMatches = (
  competitions: WebCompetitionViewModel[]
): CompetitionMatch[] => {
  const seen = new Set<string>();
  const matches: CompetitionMatch[] = [];

  for (const competition of competitions) {
    for (const match of getCompetitionMatches(competition)) {
      const identity = `${competition.resolvedLeague}-${getMatchIdentity(match)}`;
      if (seen.has(identity)) continue;

      seen.add(identity);
      matches.push({ competition, match });
    }
  }

  return sortCompetitionMatches(matches);
};

const sortCompetitionMatches = (matches: CompetitionMatch[]) => {
  return [...matches].sort((a, b) => {
    const statusRank = (item: CompetitionMatch) => {
      const status = getMatchStatus(item.match);
      if (status === "live") return 0;
      if (status === "upcoming") return 1;
      if (status === "unknown") return 2;
      return 3;
    };
    const byStatus = statusRank(a) - statusRank(b);
    if (byStatus !== 0) return byStatus;

    const byTime = getMatchTime(a.match) - getMatchTime(b.match);
    if (byTime !== 0) return byTime;

    return a.competition.leagueLabel.localeCompare(b.competition.leagueLabel);
  });
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
    } satisfies Record<MatchStatus, number>
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
      .replace(/^-+|-+$/g, "")
  );
};

export const getTeamId = (team?: ApiTeam | ApiTableRow) => {
  const numericId =
    "teamId" in (team ?? {}) ? (team as ApiTeam).teamId : (team as ApiTableRow)?.teamInfoId;
  const name =
    "teamName" in (team ?? {}) ? team?.teamName : (team as ApiTableRow | undefined)?.teamName;

  if (typeof numericId === "number") return String(numericId);
  if (name) return normalizeTeamId(name);
  return "team";
};

export const resolveCompetitionLeagueForMatch = (
  match: ApiMatch
): LeagueKey | undefined => {
  const shortcut = (match.leagueShortcut ?? "").toLowerCase();
  const name = (match.leagueName ?? "").toLowerCase();

  return LEAGUE_GROUPS.find(
    (group) =>
      group.shortcutMatch.some((needle) => shortcut.startsWith(needle)) ||
      group.nameMatch.some((needle) => name.includes(needle))
  )?.key;
};

export const findMatchById = (
  competitions: WebCompetitionViewModel[],
  matchId: string
) => {
  return getAllCompetitionMatches(competitions).find(
    (item) => String(item.match.matchID) === matchId
  );
};

export const collectTeams = (
  competitions: WebCompetitionViewModel[]
): TeamSummary[] => {
  const teams = new Map<string, TeamSummary>();
  const allMatches = getAllCompetitionMatches(competitions);

  const upsertTeam = ({
    competition,
    iconUrl,
    id,
    match,
    name,
    tablePosition,
  }: {
    competition: WebCompetitionViewModel;
    iconUrl?: string;
    id: string;
    match?: CompetitionMatch;
    name: string;
    tablePosition?: TeamSummary["tablePosition"];
  }) => {
    const existing = teams.get(id);
    const summary =
      existing ??
      ({
        competitions: [],
        iconUrl,
        id,
        name,
        recentMatches: [],
        upcomingMatches: [],
      } satisfies TeamSummary);

    summary.iconUrl ??= iconUrl;
    if (!summary.competitions.some((entry) => entry.league === competition.resolvedLeague)) {
      summary.competitions.push({
        label: competition.leagueLabel,
        league: competition.resolvedLeague,
        season: competition.resolvedSeason,
      });
    }

    if (tablePosition && !summary.tablePosition) {
      summary.tablePosition = tablePosition;
    }

    if (match) {
      const status = getMatchStatus(match.match);
      if (status === "finished") {
        if (
          !summary.recentMatches.some(
            (entry) => getMatchIdentity(entry.match) === getMatchIdentity(match.match)
          )
        ) {
          summary.recentMatches.push(match);
        }
        const recentTime = summary.recentMatch
          ? getMatchTime(summary.recentMatch.match)
          : Number.NEGATIVE_INFINITY;
        if (getMatchTime(match.match) >= recentTime) {
          summary.recentMatch = match;
        }
      } else if (status === "live" || status === "upcoming") {
        if (
          !summary.upcomingMatches.some(
            (entry) => getMatchIdentity(entry.match) === getMatchIdentity(match.match)
          )
        ) {
          summary.upcomingMatches.push(match);
        }
        const nextTime = summary.nextMatch
          ? getMatchTime(summary.nextMatch.match)
          : Number.POSITIVE_INFINITY;
        if (getMatchTime(match.match) <= nextTime) {
          summary.nextMatch = match;
        }
      }
    }

    teams.set(id, summary);
  };

  for (const competition of competitions) {
    const table = competition.sections.find((section) => section.renderKind === "table");
    if (table?.renderKind === "table") {
      table.items.forEach((row, index) => {
        upsertTeam({
          competition,
          iconUrl: row.teamIconUrl,
          id: getTeamId(row),
          name: row.teamName ?? row.shortName ?? "Team",
          tablePosition: {
            competitionLabel: competition.leagueLabel,
            points: row.points,
            position: index + 1,
          },
        });
      });
    }
  }

  for (const item of allMatches) {
    for (const team of [item.match.team1, item.match.team2]) {
      if (!team) continue;
      upsertTeam({
        competition: item.competition,
        iconUrl: team.teamIconUrl,
        id: getTeamId(team),
        match: item,
        name: getTeamLabel(team, "Team"),
      });
    }
  }

  for (const team of teams.values()) {
    team.recentMatches.sort(
      (a, b) => getMatchTime(b.match) - getMatchTime(a.match)
    );
    team.upcomingMatches.sort(
      (a, b) => getMatchTime(a.match) - getMatchTime(b.match)
    );
  }

  return [...teams.values()].sort((a, b) => {
    const aPosition = a.tablePosition?.position ?? Number.MAX_SAFE_INTEGER;
    const bPosition = b.tablePosition?.position ?? Number.MAX_SAFE_INTEGER;
    if (aPosition !== bPosition) return aPosition - bPosition;

    return a.name.localeCompare(b.name);
  });
};
