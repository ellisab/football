import type { ApiGroup, ApiMatch } from "../openligadb/index";

const kickoffFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatKickoff = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return kickoffFormatter.format(date);
};

export const sortGoals = (match: ApiMatch) => {
  if (!match.goals || match.goals.length < 2) return match;

  return {
    ...match,
    goals: [...match.goals].sort(
      (a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)
    ),
  };
};

export const isKnockoutGroup = (name?: string) => {
  const value = (name ?? "").toLowerCase();

  return (
    value.includes("achtelfinale") ||
    value.includes("viertelfinale") ||
    value.includes("halbfinale") ||
    value.includes("finale") ||
    value.includes("round of 16") ||
    value.includes("quarter") ||
    value.includes("semi") ||
    value.includes("playoff")
  );
};

export const areAllMatchesFinished = (matches: ApiMatch[]) => {
  return matches.length > 0 && matches.every((match) => match.matchIsFinished === true);
};

export const findNextGroup = (
  groups: Array<Pick<ApiGroup, "groupOrderID" | "groupName">>,
  currentGroupOrderID?: number
) => {
  if (!currentGroupOrderID) return undefined;

  return groups
    .filter((group) => typeof group.groupOrderID === "number")
    .filter((group) => (group.groupOrderID ?? 0) > currentGroupOrderID)
    .sort((a, b) => (a.groupOrderID ?? 0) - (b.groupOrderID ?? 0))[0];
};
