import {
  buildLeagueOptions,
  getAvailableGroupKeys,
  getCurrentSeasonYear,
  hasLeagueTable,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
  resolveLeagueSelection,
  resolveSeasonSelection,
} from "../leagues";
import { sortGoals } from "../matches";
import { openLigaDbDataSource } from "../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import { loadBracketMatches } from "./domain/load-bracket";
import { loadPrimaryHomeData } from "./domain/load-primary-data";
import { normalizeLeagueEntries } from "./domain/league-groups";
import { resolveRoundSnapshots } from "./domain/resolve-rounds";
import type { HomeSnapshot } from "./types";

export const getHomeSnapshot = async (
  params: {
    league?: string;
    season?: string;
  },
  options?: {
    dataSource?: FootballDataSource;
    requestOptions?: HomeRequestOptions;
    fallbackYear?: number;
  }
): Promise<HomeSnapshot> => {
  const dataSource = options?.dataSource ?? openLigaDbDataSource;
  const requestOptions = options?.requestOptions;
  const normalizedGroups = await normalizeLeagueEntries(dataSource, requestOptions);
  const availableGroupKeys = getAvailableGroupKeys(normalizedGroups);
  const resolvedLeague = resolveLeagueSelection(params.league, availableGroupKeys);

  const leagueEntries = normalizedGroups.get(resolvedLeague) ?? [];
  const resolvedSeason = resolveSeasonSelection({
    requestedSeason: params.season,
    entries: leagueEntries,
    fallbackYear: options?.fallbackYear ?? getCurrentSeasonYear(),
  });

  const entryForSeason = pickLeagueEntryForSeason(leagueEntries, resolvedSeason);
  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    resolvedLeague,
    entryForSeason?.leagueShortcut
  );

  const primaryHomeData = await loadPrimaryHomeData({
    dataSource,
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    requestOptions,
  });
  const dataErrors = [...primaryHomeData.errorKeys];

  const matchdayPromise = primaryHomeData.currentGroup?.groupOrderID
    ? dataSource.getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        primaryHomeData.currentGroup.groupOrderID,
        requestOptions
      )
    : Promise.resolve([]);

  const [matchdayResult] = await Promise.allSettled([matchdayPromise]);

  const matches =
    matchdayResult.status === "fulfilled"
      ? matchdayResult.value.map(sortGoals)
      : (dataErrors.push("matchday"), []);
  const baseCurrentRound = {
    groupName: primaryHomeData.currentGroup?.groupName,
    groupOrderID: primaryHomeData.currentGroup?.groupOrderID,
    matches,
  };

  const { currentRound, nextRound, errorKeys: roundErrorKeys } =
    primaryHomeData.currentGroup?.groupOrderID
      ? await resolveRoundSnapshots({
          dataSource,
          currentGroup: primaryHomeData.currentGroup,
          currentRound: baseCurrentRound,
          groups: primaryHomeData.groups,
          resolvedLeague,
          effectiveShortcut,
          resolvedSeason,
          requestOptions,
        })
      : {
          currentRound: baseCurrentRound,
          nextRound: { matches: [] },
          errorKeys: [],
        };

  const { bracketMatches, errorKeys: bracketErrorKeys } = await loadBracketMatches({
    dataSource,
    resolvedLeague,
    currentRound,
    nextRound,
    groups: primaryHomeData.groups,
    playoffMatches: primaryHomeData.playoffMatches,
    effectiveShortcut,
    resolvedSeason,
    requestOptions,
  });

  dataErrors.push(...roundErrorKeys, ...bracketErrorKeys);

  const leagueOptions = buildLeagueOptions({
    availableGroupKeys,
    groupedLeagues: normalizedGroups,
  });

  return {
    resolvedLeague,
    resolvedSeason,
    leagueOptions,
    currentRound,
    nextRound,
    hasTable: hasLeagueTable(resolvedLeague),
    bracketMatches,
    table: primaryHomeData.table,
    errorKeys: Array.from(new Set(dataErrors)),
  };
};
