import type { ApiGroup, ApiMatch } from "../openligadb/index";
import { compareMatchesByKickoff } from "./match-order";

const berlinDateKeyFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});
const MATCHDAY_REGEX = /(\d{1,2})\.\s*spieltag/i;
const PLAYOFF_REGEX = /playoffs?/i;
const GERMAN_KNOCKOUT_ROUND_REGEX = /\b\d+\.\s*runde\b/i;
const KNOCKOUT_FIRST_LEG_REGEX = /\b(hinspiele?|first legs?|first leg)\b/i;
const KNOCKOUT_SECOND_LEG_REGEX =
  /\b(rueckspiele?|rückspiele?|second legs?|second leg)\b/i;
const KNOCKOUT_STAGE_SUFFIX_REGEX =
  /\b(hinspiele?|rueckspiele?|rückspiele?|first legs?|second legs?|first leg|second leg)\b/gi;
const LOCALIZED_KNOCKOUT_ROUND_NAMES: Array<[RegExp, string]> = [
  [/^playoffs?$/i, "Playoffs"],
  [/^round of 32$/i, "Runde der letzten 32"],
  [/^round of 16$/i, "Achtelfinale"],
  [/^quarter(?:-| )finals?$/i, "Viertelfinale"],
  [/^semi(?:-| )finals?$/i, "Halbfinale"],
  [/^third(?:-| )place(?: match)?$/i, "Spiel um Platz 3"],
  [/^final$/i, "Finale"],
  [/^group stage$/i, "Gruppenphase"],
];

export const getBerlinDateKey = (value?: Date | string) => {
  if (!value) return undefined;

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return undefined;

  const parts = berlinDateKeyFormatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  if (!day || !month || !year) return undefined;

  return `${year}-${month}-${day}`;
};

export const getMatchBerlinDateKey = (match: ApiMatch) => {
  return getBerlinDateKey(match.matchDateTimeUTC ?? match.matchDateTime);
};

export const isMatchOnBerlinDate = (match: ApiMatch, dateKey: string) => {
  return getMatchBerlinDateKey(match) === dateKey;
};

export const getMatchdayNumber = (groupName: string) => {
  return groupName.match(MATCHDAY_REGEX)?.[1] ?? null;
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
      (a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0),
    ),
  };
};

export const sortMatchesByKickoff = (matches: ApiMatch[]) => {
  return [...matches].sort(compareMatchesByKickoff);
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

export const getKnockoutLeg = (
  groupName?: string,
): "first" | "second" | null => {
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
    value.includes("sechzehntelfinale") ||
    value.includes("runde der letzten 32") ||
    value.includes("viertelfinale") ||
    value.includes("halbfinale") ||
    value.includes("finale") ||
    /\bfinals?\b/.test(value) ||
    value.includes("spiel um platz") ||
    value.includes("third-place") ||
    value.includes("third place") ||
    value.includes("round of 32") ||
    value.includes("round of 16") ||
    value.includes("quarter") ||
    value.includes("semi") ||
    value.includes("playoff")
  );
};

export const areAllMatchesFinished = (matches: ApiMatch[]) => {
  return (
    matches.length > 0 &&
    matches.every((match) => match.matchIsFinished === true)
  );
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
  currentGroupOrderID?: number,
) => {
  if (!currentGroupOrderID) return undefined;

  return groups
    .filter((group) => typeof group.groupOrderID === "number")
    .filter((group) => (group.groupOrderID ?? 0) > currentGroupOrderID)
    .sort((a, b) => (a.groupOrderID ?? 0) - (b.groupOrderID ?? 0))[0];
};
