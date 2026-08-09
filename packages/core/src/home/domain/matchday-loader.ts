import type { ApiMatch } from "../../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";

type MatchdayLoadResult = {
  matches: ApiMatch[];
};

export const loadMatchdayResults = async ({
  dataSource,
  groupOrderId,
  leagueShortcut,
  requestOptions,
  season,
}: {
  dataSource: FootballDataSource;
  groupOrderId: number;
  leagueShortcut: string;
  requestOptions?: HomeRequestOptions;
  season: number;
}): Promise<MatchdayLoadResult> => ({
  matches: await dataSource.getMatchdayResults(
    leagueShortcut,
    season,
    groupOrderId,
    requestOptions,
  ),
});
