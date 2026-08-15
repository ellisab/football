import {
  getAvailableGroupKeys,
  hasLeagueTable,
  isLeagueKey,
  type LeagueKey,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
} from "../leagues";
import { type ApiTableRow, openLigaDbDataSource } from "../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import { normalizeLeagueEntries } from "./domain/league-groups";

export class TableSnapshotError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TableSnapshotError";
    this.status = status;
  }
}

export type TableSnapshot = {
  checkedAt: number;
  effectiveShortcut: string;
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  table: ApiTableRow[];
};

const getRequestedLeague = (league: string | undefined): LeagueKey => {
  if (!league || !isLeagueKey(league)) {
    throw new TableSnapshotError("Unsupported league.", 400);
  }

  if (!hasLeagueTable(league)) {
    throw new TableSnapshotError("League does not provide a table.", 404);
  }

  return league;
};

const getRequestedSeason = (season: string | undefined) => {
  if (!season) {
    throw new TableSnapshotError("Missing or invalid season.", 400);
  }

  const parsed = Number.parseInt(season, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== season) {
    throw new TableSnapshotError("Missing or invalid season.", 400);
  }

  return parsed;
};

export const getTableSnapshot = async (
  params: {
    league?: string;
    season?: string;
  },
  options?: {
    dataSource?: FootballDataSource;
    requestOptions?: HomeRequestOptions;
    validationRequestOptions?: HomeRequestOptions;
  },
): Promise<TableSnapshot> => {
  const requestedLeague = getRequestedLeague(params.league);
  const requestedSeason = getRequestedSeason(params.season);
  const dataSource = options?.dataSource ?? openLigaDbDataSource;
  const requestOptions = options?.requestOptions;
  const normalizedGroups = await normalizeLeagueEntries(
    dataSource,
    options?.validationRequestOptions,
  );
  const availableGroupKeys = getAvailableGroupKeys(normalizedGroups);

  if (!availableGroupKeys.includes(requestedLeague)) {
    throw new TableSnapshotError("League is not available.", 404);
  }

  const leagueEntries = normalizedGroups.get(requestedLeague) ?? [];
  const entryForSeason = pickLeagueEntryForSeason(
    leagueEntries,
    requestedSeason,
  );

  if (!entryForSeason) {
    throw new TableSnapshotError("Season is not available.", 404);
  }

  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    requestedLeague,
    entryForSeason.leagueShortcut,
  );
  const table = await dataSource.getTable(
    effectiveShortcut,
    requestedSeason,
    requestOptions,
  );

  return {
    checkedAt: Date.now(),
    effectiveShortcut,
    resolvedLeague: requestedLeague,
    resolvedSeason: requestedSeason,
    table,
  };
};
