import { isBroadcasterId } from "./catalog";
import type {
  BroadcastCoverage,
  ManualBroadcastOverride,
  ManualBroadcastSelection,
} from "./types";
import { isSupportedBroadcastLeague } from "./types";

export type ManualBroadcastValidation = {
  issues: string[];
  overrides: ManualBroadcastOverride[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isCoverage = (value: unknown): value is BroadcastCoverage => {
  return value === "conference" || value === "individual";
};

const isValidDate = (value: unknown): value is string => {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
};

const isValidUtcDate = (value: unknown): value is string => {
  return isValidDate(value) && /Z$/i.test(value);
};

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const parseSelections = (
  value: unknown,
  index: number,
  issues: string[],
): ManualBroadcastSelection[] | undefined => {
  if (!Array.isArray(value)) {
    issues.push(`Eintrag ${index}: "broadcasters" muss eine Liste sein.`);
    return undefined;
  }

  const selections: ManualBroadcastSelection[] = [];
  const keys = new Set<string>();

  for (const [selectionIndex, selection] of value.entries()) {
    if (
      !isRecord(selection) ||
      !isBroadcasterId(selection.broadcasterId) ||
      !isCoverage(selection.coverage)
    ) {
      issues.push(
        `Eintrag ${index}, Sender ${selectionIndex}: ungültige Senderauswahl.`,
      );
      return undefined;
    }

    const key = `${selection.broadcasterId}:${selection.coverage}`;
    if (keys.has(key)) {
      issues.push(
        `Eintrag ${index}: Senderauswahl "${key}" ist doppelt vorhanden.`,
      );
      return undefined;
    }

    keys.add(key);
    selections.push({
      broadcasterId: selection.broadcasterId,
      coverage: selection.coverage,
    });
  }

  return selections;
};

export const validateManualBroadcastOverrides = (
  value: unknown,
): ManualBroadcastValidation => {
  if (!Array.isArray(value)) {
    return {
      issues: ["Die Override-Datei muss eine JSON-Liste enthalten."],
      overrides: [],
    };
  }

  const issues: string[] = [];
  const overrides: ManualBroadcastOverride[] = [];
  const matchKeys = new Set<string>();

  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      issues.push(`Eintrag ${index}: kein gültiges Objekt.`);
      continue;
    }

    const {
      awayTeamId,
      broadcasters,
      competitionId,
      homeTeamId,
      kickoffUtc,
      matchId,
      matchKey,
      note,
      season,
      sourceUrl,
      verifiedAt,
    } = candidate;
    const expectedMatchKey = `${competitionId}:${matchId}`;
    const selections = parseSelections(broadcasters, index, issues);
    const isValid =
      isSupportedBroadcastLeague(competitionId) &&
      isPositiveInteger(matchId) &&
      matchKey === expectedMatchKey &&
      isPositiveInteger(season) &&
      isValidUtcDate(kickoffUtc) &&
      isPositiveInteger(homeTeamId) &&
      isPositiveInteger(awayTeamId) &&
      isHttpsUrl(sourceUrl) &&
      isValidDate(verifiedAt) &&
      (note === undefined || typeof note === "string") &&
      selections !== undefined;

    if (!isValid) {
      issues.push(
        `Eintrag ${index}: Pflichtfelder oder Signatur sind ungültig.`,
      );
      continue;
    }

    if (matchKeys.has(matchKey)) {
      issues.push(`Eintrag ${index}: Match-Key "${matchKey}" ist doppelt.`);
      continue;
    }

    matchKeys.add(matchKey);
    overrides.push({
      awayTeamId,
      broadcasters: selections,
      competitionId,
      homeTeamId,
      kickoffUtc,
      matchId,
      matchKey,
      note,
      season,
      sourceUrl,
      verifiedAt,
    });
  }

  return { issues, overrides };
};
