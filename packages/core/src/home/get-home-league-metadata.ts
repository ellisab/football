import { buildLeagueOptions, getAvailableGroupKeys } from "../leagues";
import { openLigaDbDataSource } from "../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import { normalizeLeagueEntries } from "./domain/league-groups";

export const getHomeLeagueMetadata = async ({
  dataSource = openLigaDbDataSource,
  requestOptions,
}: {
  dataSource?: FootballDataSource;
  requestOptions?: HomeRequestOptions;
} = {}) => {
  const groupedLeagues = await normalizeLeagueEntries(
    dataSource,
    requestOptions,
  );
  const availableGroupKeys = getAvailableGroupKeys(groupedLeagues);
  return {
    groupedLeagues,
    availableGroupKeys,
    leagueOptions: buildLeagueOptions({ availableGroupKeys, groupedLeagues }),
  };
};

export type HomeLeagueMetadata = Awaited<
  ReturnType<typeof getHomeLeagueMetadata>
>;
