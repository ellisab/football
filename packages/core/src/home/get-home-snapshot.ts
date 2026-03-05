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
import { getMatchdayResults, type FetchOptions } from "../openligadb";
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
    fetchOptions?: FetchOptions;
    fallbackYear?: number;
  }
): Promise<HomeSnapshot> => {
  const fetchOptions = options?.fetchOptions;
  const normalizedGroups = await normalizeLeagueEntries(fetchOptions);
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
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    fetchOptions,
  });
  const dataErrors = [...primaryHomeData.errorKeys];

  const matchdayPromise = primaryHomeData.currentGroup?.groupOrderID
    ? getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        primaryHomeData.currentGroup.groupOrderID,
        fetchOptions
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
          currentGroup: primaryHomeData.currentGroup,
          currentRound: baseCurrentRound,
          groups: primaryHomeData.groups,
          resolvedLeague,
          effectiveShortcut,
          resolvedSeason,
          fetchOptions,
        })
      : {
          currentRound: baseCurrentRound,
          nextRound: { matches: [] },
          errorKeys: [],
        };

  const { bracketMatches, errorKeys: bracketErrorKeys } = await loadBracketMatches({
    groups: primaryHomeData.groups,
    playoffMatches: primaryHomeData.playoffMatches,
    effectiveShortcut,
    resolvedSeason,
    fetchOptions,
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
