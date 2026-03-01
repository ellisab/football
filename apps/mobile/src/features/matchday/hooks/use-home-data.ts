import { useEffect, useState } from "react";
import {
  getDataShortcutForLeague,
  getGroupShortcutForLeague,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import {
  findNextGroup,
  isKnockoutGroup,
  sortGoals,
} from "@footballleagues/core/matches";
import {
  getCurrentGroup,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
  type ApiGroup,
  type ApiMatch,
} from "@footballleagues/core/openligadb";
import type { BracketRound, HomeDataState } from "../types";

const getStatusCode = (error: unknown) => {
  const reason = error as { status?: number } | undefined;
  return reason?.status;
};

const MAX_NEXT_GROUP_LOOKAHEAD = 8;

export function useHomeData(activeLeague: LeagueKey, season: number) {
  const [state, setState] = useState<Omit<HomeDataState, "activeLeague">>({
    groupName: "Latest Matchday",
    matches: [],
    nextGroupName: "",
    nextMatches: [],
    table: [],
    bracketMatches: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const dataShortcut = getDataShortcutForLeague(activeLeague);
        const groupShortcut = getGroupShortcutForLeague(activeLeague);

        const groupPromise = getCurrentGroup(dataShortcut);
        const tablePromise =
          activeLeague === "dfb"
            ? Promise.resolve([])
            : getTable(dataShortcut, season);
        const groupsPromise =
          activeLeague === "cl"
            ? (async () => {
                try {
                  const groups = await getGroups(groupShortcut, season);
                  return { groups, shortcut: groupShortcut };
                } catch {
                  const groups = await getGroups(dataShortcut, season);
                  return { groups, shortcut: dataShortcut };
                }
              })()
            : Promise.resolve({ groups: [], shortcut: dataShortcut });
        const playoffPromise =
          activeLeague === "cl"
            ? getMatchdayResults(dataShortcut, season, 9)
            : Promise.resolve([]);

        const [groupResult, tableResult, groupsResult, playoffResult] = await Promise.allSettled([
          groupPromise,
          tablePromise,
          groupsPromise,
          playoffPromise,
        ]);

        if (!isMounted) return;

        const groupName =
          groupResult.status === "fulfilled"
            ? groupResult.value?.groupName || "Latest Matchday"
            : "Latest Matchday";
        const hasPartialError = groupResult.status !== "fulfilled";

        const table =
          tableResult.status === "fulfilled" && Array.isArray(tableResult.value)
            ? tableResult.value
            : [];

        let knockoutGroups: ApiGroup[] = [];
        let knockoutShortcut = dataShortcut;

        if (groupsResult.status === "fulfilled") {
          const groups = Array.isArray(groupsResult.value?.groups)
            ? groupsResult.value.groups
            : [];
          knockoutShortcut = groupsResult.value?.shortcut ?? dataShortcut;
          knockoutGroups = groups.filter((group) => isKnockoutGroup(group?.groupName));
        }

        const bracket: BracketRound[] = [];

        if (playoffResult.status === "fulfilled") {
          const playoffMatches = Array.isArray(playoffResult.value)
            ? playoffResult.value.map(sortGoals)
            : [];

          if (playoffMatches.length > 0) {
            bracket.push({
              group: { groupName: "Playoffs", groupID: 9 },
              matches: playoffMatches,
            });
          }
        }

        const knockoutRoundResults = await Promise.allSettled(
          knockoutGroups.map(async (group) => {
            if (!group?.groupOrderID) return { group, matches: [] as ApiMatch[] };

            const roundMatches = await getMatchesByGroup(
              knockoutShortcut,
              season,
              group.groupOrderID
            );

            return {
              group,
              matches: Array.isArray(roundMatches)
                ? roundMatches.map(sortGoals)
                : [],
            };
          })
        );

        for (let index = 0; index < knockoutRoundResults.length; index += 1) {
          const result = knockoutRoundResults[index];
          const fallbackGroup = knockoutGroups[index] as ApiGroup;

          if (result.status === "fulfilled") {
            bracket.push(result.value);
          } else {
            bracket.push({ group: fallbackGroup, matches: [] });
          }
        }

        const groupOrderID =
          groupResult.status === "fulfilled"
            ? groupResult.value?.groupOrderID
            : undefined;

        if (!groupOrderID) {
          throw new Error("Missing group order");
        }

        const matchday = await getMatchdayResults(dataShortcut, season, groupOrderID);
        if (!isMounted) return;

        const currentRoundMatches = Array.isArray(matchday)
          ? matchday.map(sortGoals)
          : [];

        let nextGroupName = "";
        let nextMatches: ApiMatch[] = [];
        let scheduleGroups =
          groupsResult.status === "fulfilled" &&
          Array.isArray(groupsResult.value?.groups)
            ? groupsResult.value.groups
            : [];

        if (scheduleGroups.length === 0) {
          try {
            const fallbackGroups = await getGroups(dataShortcut, season);
            scheduleGroups = Array.isArray(fallbackGroups) ? fallbackGroups : [];
          } catch {
            scheduleGroups = [];
          }
        }

        const nextGroup = findNextGroup(scheduleGroups, groupOrderID);
        const knownFutureGroupOrderIDs = scheduleGroups
          .map((group) => group?.groupOrderID)
          .filter(
            (orderID): orderID is number =>
              typeof orderID === "number" && orderID > groupOrderID
          )
          .sort((a, b) => a - b);
        const fallbackFutureGroupOrderIDs = Array.from(
          { length: MAX_NEXT_GROUP_LOOKAHEAD },
          (_, index) => groupOrderID + index + 1
        );
        const candidateNextGroupOrderIDs = Array.from(
          new Set([
            ...(typeof nextGroup?.groupOrderID === "number"
              ? [nextGroup.groupOrderID]
              : []),
            ...knownFutureGroupOrderIDs,
            ...fallbackFutureGroupOrderIDs,
          ])
        );

        for (const candidateGroupOrderID of candidateNextGroupOrderIDs) {
          try {
            const nextRound = await getMatchdayResults(
              dataShortcut,
              season,
              candidateGroupOrderID
            );

            if (!isMounted) return;

            const normalizedNextMatches = Array.isArray(nextRound)
              ? nextRound.map(sortGoals)
              : [];

            if (normalizedNextMatches.length === 0) {
              continue;
            }

            const candidateGroup = scheduleGroups.find(
              (group) => group?.groupOrderID === candidateGroupOrderID
            );

            nextGroupName = candidateGroup?.groupName || "Next Matchday";
            nextMatches = normalizedNextMatches;
            break;
          } catch (error) {
            if (getStatusCode(error) !== 404) {
              // Ignore hard failure for next fixtures, keep the current payload.
            }
          }
        }

        setState({
          groupName,
          matches: currentRoundMatches,
          nextGroupName,
          nextMatches,
          table,
          bracketMatches: bracket,
          loading: false,
          error: hasPartialError ? "Some data failed to load. Pull to refresh." : "",
        });
      } catch {
        if (!isMounted) return;

        setState({
          groupName: "Latest Matchday",
          matches: [],
          nextGroupName: "",
          nextMatches: [],
          table: [],
          bracketMatches: [],
          loading: false,
          error: "Failed to load matches. Pull to refresh.",
        });
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [activeLeague, season]);

  return state;
}
