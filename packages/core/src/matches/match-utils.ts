import type { ApiGroup, ApiMatch } from "../openligadb/index";

const kickoffFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const MATCHDAY_REGEX = /(\d{1,2})\.\s*spieltag/i;
const PLAYOFF_REGEX = /playoffs?/i;
const GERMAN_KNOCKOUT_ROUND_REGEX = /\b\d+\.\s*runde\b/i;
const KNOCKOUT_FIRST_LEG_REGEX = /\b(hinspiele?|first legs?|first leg)\b/i;
const KNOCKOUT_SECOND_LEG_REGEX = /\b(rueckspiele?|rückspiele?|second legs?|second leg)\b/i;
const KNOCKOUT_STAGE_SUFFIX_REGEX =
  /\b(hinspiele?|rueckspiele?|rückspiele?|first legs?|second legs?|first leg|second leg)\b/gi;
const LOCALIZED_KNOCKOUT_ROUND_NAMES: Array<[RegExp, string]> = [
  [/^playoffs?$/i, "Playoffs"],
  [/^round of 16$/i, "Achtelfinale"],
  [/^quarter(?:-| )finals?$/i, "Viertelfinale"],
  [/^semi(?:-| )finals?$/i, "Halbfinale"],
  [/^final$/i, "Finale"],
  [/^group stage$/i, "Gruppenphase"],
];

export const formatKickoff = (value?: string) => {
  if (!value) return "Termin offen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Termin offen";
  return kickoffFormatter.format(date);
};

export const getMatchdayNumber = (groupName: string) => {
  return groupName.match(MATCHDAY_REGEX)?.[1] ?? null;
};

export const getStageLabel = (groupName: string) => {
  const normalized = groupName.trim();
  if (!normalized) return "Spieltag";

  const matchdayNumber = getMatchdayNumber(normalized);
  if (matchdayNumber) return `${matchdayNumber}. Spieltag`;

  return localizeGroupName(normalized);
};

export const localizeGroupName = (groupName?: string) => {
  const normalized = (groupName ?? "").trim();
  if (!normalized) return "";

  const matchdayNumber = getMatchdayNumber(normalized);
  if (matchdayNumber) return `${matchdayNumber}. Spieltag`;

  const hasFirstLeg = KNOCKOUT_FIRST_LEG_REGEX.test(normalized);
  const hasSecondLeg = KNOCKOUT_SECOND_LEG_REGEX.test(normalized);
  const stageBase = normalized
    .replace(KNOCKOUT_STAGE_SUFFIX_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-–:\s]+$/g, "")
    .trim();

  let localizedStage = stageBase || normalized;
  for (const [pattern, replacement] of LOCALIZED_KNOCKOUT_ROUND_NAMES) {
    if (pattern.test(localizedStage)) {
      localizedStage = replacement;
      break;
    }
  }

  if (hasFirstLeg) {
    return `${localizedStage} Hinspiele`;
  }

  if (hasSecondLeg) {
    return `${localizedStage} Rückspiele`;
  }

  return localizedStage;
};

export const isPlayoffRoundName = (groupName?: string) => {
  return PLAYOFF_REGEX.test(groupName ?? "");
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

const getMatchTime = (match: ApiMatch) => {
  const timestamp = Date.parse(match.matchDateTimeUTC ?? match.matchDateTime ?? "");
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const sortMatchesByKickoff = (matches: ApiMatch[]) => {
  return [...matches].sort((a, b) => {
    const byTime = getMatchTime(a) - getMatchTime(b);
    if (byTime !== 0) return byTime;

    return (a.matchID ?? 0) - (b.matchID ?? 0);
  });
};

export const getKnockoutStageName = (groupName?: string) => {
  const normalized = (groupName ?? "").trim();
  if (!normalized) return undefined;

  const withoutLegLabel = normalized
    .replace(KNOCKOUT_STAGE_SUFFIX_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-–:\s]+$/g, "")
    .trim();

  return withoutLegLabel || normalized;
};

export const getKnockoutLeg = (groupName?: string): "first" | "second" | null => {
  if (KNOCKOUT_FIRST_LEG_REGEX.test(groupName ?? "")) {
    return "first";
  }

  if (KNOCKOUT_SECOND_LEG_REGEX.test(groupName ?? "")) {
    return "second";
  }

  return null;
};

export const isKnockoutGroup = (name?: string) => {
  const value = (name ?? "").toLowerCase();

  return (
    GERMAN_KNOCKOUT_ROUND_REGEX.test(value) ||
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

export const hasAnyMatchResult = (matches: ApiMatch[]) => {
  return matches.some((match) => {
    if (match.matchIsFinished === true) {
      return true;
    }

    return (match.matchResults?.length ?? 0) > 0;
  });
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
