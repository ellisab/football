import { mapSettledWithConcurrency } from "@footballleagues/core/async";
import { createHomeState } from "@footballleagues/core/home";
import {
  buildLeagueEntriesByGroup,
  getCurrentSeasonYear,
  getDataShortcutForLeague,
  LEAGUE_GROUPS,
  pickLeagueEntryForSeason,
  resolveSeasonsFromLeagues,
} from "@footballleagues/core/leagues";
import {
  isMatchOnBerlinDate,
  parseBerlinDateQuery,
} from "@footballleagues/core/matches";
import {
  type ApiLeague,
  getAllMatches,
  getAvailableLeagues,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import { getTodayCompetitionMatches } from "@/features/football/view-utils";
import {
  createWebHomeViewModel,
  type WebHomeViewModel,
} from "@/features/home/presenter/home-view-model";

type ScheduleSource = {
  getAvailableLeagues: typeof getAvailableLeagues;
  getAllMatches: typeof getAllMatches;
};

export const getTodayPageData = async (
  dateKey: string,
  source: ScheduleSource = { getAvailableLeagues, getAllMatches },
) => {
  if (!parseBerlinDateQuery(dateKey))
    throw new RangeError("Invalid schedule date");
  const date = new Date(`${dateKey}T12:00:00Z`);
  const season = getCurrentSeasonYear(date);
  let leagues: ApiLeague[] = [];
  try {
    leagues = await source.getAvailableLeagues();
  } catch {
    // Canonical feeds still work when discovery is temporarily unavailable.
  }
  const entries = buildLeagueEntriesByGroup(leagues);
  const requests = LEAGUE_GROUPS.map(({ key: league }) => {
    const available = entries.get(league) ?? [];
    // Nations League editions span two years; domestic seasons start annually.
    const resolvedSeason =
      league === "nla"
        ? (resolveSeasonsFromLeagues(available).find(
            (year) => year <= season && year >= season - 1,
          ) ?? season)
        : season;
    const shortcut =
      pickLeagueEntryForSeason(available, resolvedSeason)?.leagueShortcut ??
      getDataShortcutForLeague(league, resolvedSeason);
    return { league, season: resolvedSeason, shortcut };
  });
  const leagueOptions = requests.map(({ league, season }) => ({
    shortcut: league,
    label: LEAGUE_GROUPS.find(({ key }) => key === league)!.label,
    seasons: [season],
  }));
  const results = await mapSettledWithConcurrency(
    requests,
    (request) =>
      source.getAllMatches(request.shortcut, request.season, {
        signal: AbortSignal.timeout(6000),
        next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
      }),
    { concurrency: 3 },
  );
  const competitions = results.map((result) => {
    const matches =
      result.status === "fulfilled"
        ? result.value.filter((match) => isMatchOnBerlinDate(match, dateKey))
        : [];
    return createWebHomeViewModel(
      createHomeState({
        resolvedLeague: result.input.league,
        resolvedSeason: result.input.season,
        leagueOptions,
        currentRound: { matches },
        nextRound: { matches: [] },
        hasTable: false,
        bracketMatches: [],
        table: [],
        errorKeys: result.status === "rejected" ? ["matchday"] : [],
      }),
    );
  });
  const failed = results.filter((result) => result.status === "rejected");
  const data: WebHomeViewModel = {
    ...competitions[0],
    competitions,
    isOverview: true,
    visibleErrors: failed.length
      ? [
          failed.length === requests.length
            ? "Der Spielplan konnte gerade nicht geladen werden. Bitte versuche es erneut."
            : "Spielpläne einzelner Wettbewerbe sind gerade nicht verfügbar. Die Liste ist möglicherweise unvollständig.",
        ]
      : [],
  };
  return { data, matches: getTodayCompetitionMatches({ competitions, date }) };
};
