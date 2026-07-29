import { getFinalResult } from "../openligadb/results";
import type { ApiMatch } from "../openligadb/types";

export const LIVE_ESTIMATE_WINDOW_MS = 3 * 60 * 60 * 1_000;

export type MatchPresentationStatus =
  | "scheduled"
  | "live-estimate"
  | "finished"
  | "status-unknown";

export type MatchPresentationScore = {
  team1: number | null;
  team2: number | null;
  label: string;
};

export type MatchPresentation = {
  kickoffTimestamp: number | null;
  score: MatchPresentationScore;
  screenReaderLabel: string;
  status: MatchPresentationStatus;
  statusLabel: string;
};

const STATUS_LABELS: Record<MatchPresentationStatus, string> = {
  scheduled: "Geplant",
  "live-estimate": "Läuft möglicherweise",
  finished: "Beendet",
  "status-unknown": "Status unklar",
};

const STATUS_ANNOUNCEMENTS: Record<MatchPresentationStatus, string> = {
  scheduled: "geplant",
  "live-estimate": "läuft möglicherweise",
  finished: "beendet",
  "status-unknown": "Status unklar",
};

const normalizeTeamName = (value: string | undefined, fallback: string) => {
  const normalized = value?.trim();
  return normalized || fallback;
};

const normalizeScorePoint = (value: number | undefined) => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
};

export const getMatchKickoffTimestamp = (match: ApiMatch): number | null => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const getMatchPresentationStatus = (
  match: ApiMatch,
  now: Date = new Date(),
): MatchPresentationStatus => {
  if (match.matchIsFinished === true) return "finished";

  const kickoffTimestamp = getMatchKickoffTimestamp(match);
  const nowTimestamp = now.getTime();

  if (kickoffTimestamp === null || Number.isNaN(nowTimestamp)) {
    return "status-unknown";
  }

  const elapsedMs = nowTimestamp - kickoffTimestamp;
  if (elapsedMs < 0) return "scheduled";
  if (elapsedMs <= LIVE_ESTIMATE_WINDOW_MS) return "live-estimate";

  return "status-unknown";
};

export const getMatchPresentationScore = (
  match: ApiMatch,
): MatchPresentationScore => {
  const result = getFinalResult(match);
  const team1 = normalizeScorePoint(result?.pointsTeam1);
  const team2 = normalizeScorePoint(result?.pointsTeam2);

  return {
    team1,
    team2,
    label: `${team1 ?? "-"}:${team2 ?? "-"}`,
  };
};

export const createMatchPresentation = (
  match: ApiMatch,
  options: {
    now?: Date;
    team1Fallback?: string;
    team2Fallback?: string;
  } = {},
): MatchPresentation => {
  const status = getMatchPresentationStatus(match, options.now);
  const score = getMatchPresentationScore(match);
  const team1 = normalizeTeamName(
    match.team1?.teamName ?? match.team1?.shortName,
    options.team1Fallback ?? "Heimteam",
  );
  const team2 = normalizeTeamName(
    match.team2?.teamName ?? match.team2?.shortName,
    options.team2Fallback ?? "Auswärtsteam",
  );
  const teamsAndScore =
    score.team1 !== null && score.team2 !== null
      ? `${team1} ${score.team1}, ${team2} ${score.team2}`
      : `${team1} gegen ${team2}`;

  return {
    kickoffTimestamp: getMatchKickoffTimestamp(match),
    score,
    screenReaderLabel: `${teamsAndScore}, ${STATUS_ANNOUNCEMENTS[status]}.`,
    status,
    statusLabel: STATUS_LABELS[status],
  };
};
