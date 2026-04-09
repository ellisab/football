import type { LeagueKey } from "../../leagues";
import {
  areAllMatchesFinished,
  getKnockoutStageName,
  isKnockoutGroup,
  sortGoals,
  sortMatchesByKickoff,
} from "../../matches";
import type { ApiGroup, ApiMatch } from "../../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import type { BracketRound, HomeErrorKey, HomeRoundSnapshot } from "../types";

const dedupeMatches = (matches: ApiMatch[]) => {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key =
      match.matchID?.toString() ??
      `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${match.matchDateTimeUTC ?? match.matchDateTime ?? "unknown"}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const mergeRoundsByStage = (rounds: BracketRound[]) => {
  const mergedRounds = new Map<
    string,
    BracketRound & {
      minGroupOrderID: number;
    }
  >();

  const sortedRounds = [...rounds].sort(
    (a, b) => (a.group.groupOrderID ?? Number.MAX_SAFE_INTEGER) - (b.group.groupOrderID ?? Number.MAX_SAFE_INTEGER)
  );

  for (const round of sortedRounds) {
    const stageName =
      getKnockoutStageName(round.group.groupName) ??
      round.group.groupName ??
      "Round";
    const normalizedMatches = sortMatchesByKickoff(round.matches);
    const existing = mergedRounds.get(stageName);

    if (!existing) {
      mergedRounds.set(stageName, {
        group: {
          groupID: round.group.groupID,
          groupName: stageName,
          groupOrderID: round.group.groupOrderID,
        },
        matches: normalizedMatches,
        minGroupOrderID: round.group.groupOrderID ?? Number.MAX_SAFE_INTEGER,
      });
      continue;
    }

    existing.group.groupOrderID =
      typeof existing.group.groupOrderID === "number" &&
      typeof round.group.groupOrderID === "number"
        ? Math.min(existing.group.groupOrderID, round.group.groupOrderID)
        : (existing.group.groupOrderID ?? round.group.groupOrderID);
    existing.minGroupOrderID = Math.min(
      existing.minGroupOrderID,
      round.group.groupOrderID ?? Number.MAX_SAFE_INTEGER
    );
    existing.matches = dedupeMatches(
      sortMatchesByKickoff([...existing.matches, ...normalizedMatches])
    );
  }

  return Array.from(mergedRounds.values())
    .sort((a, b) => a.minGroupOrderID - b.minGroupOrderID)
    .map((round) => {
      const { minGroupOrderID, ...nextRound } = round;

      void minGroupOrderID;
      return nextRound;
    });
};

const selectLatestChampionsLeagueRound = (rounds: BracketRound[]) => {
  const roundsWithMatches = mergeRoundsByStage(rounds).filter(
    (round) => round.matches.length > 0
  );

  if (roundsWithMatches.length === 0) {
    return [];
  }

  const latestActiveRound = roundsWithMatches.find(
    (round) => !areAllMatchesFinished(round.matches)
  );

  return [latestActiveRound ?? roundsWithMatches[roundsWithMatches.length - 1]];
};

const snapshotToBracketRound = (round: HomeRoundSnapshot): BracketRound | null => {
  if (!isKnockoutGroup(round.groupName) || round.matches.length === 0) {
    return null;
  }

  return {
    group: {
      groupName: round.groupName,
      groupOrderID: round.groupOrderID,
    },
    matches: round.matches,
  };
};

export const loadBracketMatches = async ({
  dataSource,
  resolvedLeague,
  currentRound,
  nextRound,
  groups,
  playoffMatches,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  resolvedLeague: LeagueKey;
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  groups: ApiGroup[];
  playoffMatches: ApiMatch[];
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  bracketMatches: BracketRound[];
  errorKeys: HomeErrorKey[];
}> => {
  const knockoutGroups = Array.isArray(groups)
    ? groups.filter((group) => isKnockoutGroup(group.groupName))
    : [];

  const knockoutRoundResults = await Promise.allSettled(
    knockoutGroups.map(async (group) => {
      if (!group.groupOrderID) return { group, matches: [] as ApiMatch[] };

      const roundMatches = await dataSource.getMatchesByGroup(
        effectiveShortcut,
        resolvedSeason,
        group.groupOrderID,
        requestOptions
      );

      return {
        group,
        matches: roundMatches.map(sortGoals),
      };
    })
  );

  const errorKeys: HomeErrorKey[] = [];
  const knockoutRounds: BracketRound[] = knockoutRoundResults.map((result, index) => {
    const fallbackGroup = knockoutGroups[index] as ApiGroup;

    if (result.status === "fulfilled") {
      return result.value;
    }

    errorKeys.push("knockout rounds");
    return {
      group: fallbackGroup,
      matches: [],
    };
  });

  const allBracketRounds =
    [
      ...knockoutRounds,
      ...(playoffMatches.length > 0
        ? [
            {
              group: { groupName: "Playoffs", groupID: 9, groupOrderID: 9 },
              matches: playoffMatches.map(sortGoals),
            },
          ]
        : []),
      ...[snapshotToBracketRound(currentRound), snapshotToBracketRound(nextRound)].filter(
        (round): round is BracketRound => round !== null
      ),
    ];

  return {
    bracketMatches:
      resolvedLeague === "cl"
        ? selectLatestChampionsLeagueRound(allBracketRounds)
        : allBracketRounds,
    errorKeys,
  };
};
