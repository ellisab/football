import type { LeagueKey } from "../leagues";
import type { ApiMatch } from "../openligadb";
import { BROADCASTER_CATALOG, sortMatchBroadcasts } from "./catalog";
import manualOverridesJson from "./data/manual-overrides.json";
import { validateManualBroadcastOverrides } from "./manual-overrides";
import type {
  BroadcastCoverage,
  BroadcasterId,
  ManualBroadcastOverride,
  MatchBroadcast,
  MatchBroadcastResolution,
} from "./types";
import { isSupportedBroadcastLeague } from "./types";

const RIGHTS_CYCLE_START = 2025;
const RIGHTS_CYCLE_END = 2028;
const BERLIN_TIME_ZONE = "Europe/Berlin";

const DFL_RIGHTS_SOURCE =
  "https://www.bundesliga.com/de/bundesliga/news/dfl-medienrechte-vergabe-tv-partner-clubs-saison-25-26-28-29-29352";
const WOW_RIGHTS_SOURCE =
  "https://www.wowtv.de/hilfe/artikel/bundesliga-bei-wow";
const RTL_PLUS_SOURCE = "https://plus.rtl.de/lp/bundesliga";
const UCL_RIGHTS_SOURCE =
  "https://www.aboutamazon.de/news/entertainment/live-sport-bei-prime-video";

const BERLIN_KICKOFF_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: BERLIN_TIME_ZONE,
  weekday: "short",
});

const WEEKDAYS = {
  Fri: 5,
  Mon: 1,
  Sat: 6,
  Sun: 0,
  Thu: 4,
  Tue: 2,
  Wed: 3,
} as const;

type KickoffSlot = {
  time: string;
  weekday: number;
};

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;
const EXPLICIT_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const normalizeUtcDateTime = (value: string) => {
  return EXPLICIT_OFFSET_PATTERN.test(value) ? value : `${value}Z`;
};

const manualOverrideValidation =
  validateManualBroadcastOverrides(manualOverridesJson);

export const MANUAL_BROADCAST_OVERRIDE_ISSUES = manualOverrideValidation.issues;

const DEFAULT_MANUAL_OVERRIDES = manualOverrideValidation.overrides;

const sourceForBroadcaster = (id: BroadcasterId) => {
  if (id === "wow") return WOW_RIGHTS_SOURCE;
  if (id === "rtl-plus") return RTL_PLUS_SOURCE;
  return DFL_RIGHTS_SOURCE;
};

const createBroadcast = (
  id: BroadcasterId,
  coverage: BroadcastCoverage,
  options?: {
    note?: string;
    sourceUrl?: string;
    verified?: boolean;
  },
): MatchBroadcast => {
  return {
    ...BROADCASTER_CATALOG[id],
    certainty: options?.verified ? "verified" : "rights-rule",
    coverage,
    note: options?.note,
    sourceUrl: options?.sourceUrl ?? sourceForBroadcaster(id),
  };
};

const createSkyIndividualBroadcasts = (): MatchBroadcast[] => [
  createBroadcast("sky", "individual"),
  createBroadcast("wow", "individual"),
];

const uniqueBroadcasts = (
  broadcasts: readonly MatchBroadcast[],
): MatchBroadcast[] => {
  const unique = new Map<string, MatchBroadcast>();

  for (const broadcast of broadcasts) {
    unique.set(`${broadcast.id}:${broadcast.coverage}`, broadcast);
  }

  return sortMatchBroadcasts([...unique.values()]);
};

const getAbsoluteKickoffSlot = (
  value: string,
  assumeUtc = false,
): KickoffSlot | undefined => {
  const normalizedValue = assumeUtc ? normalizeUtcDateTime(value) : value;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return undefined;

  const parts = BERLIN_KICKOFF_FORMATTER.formatToParts(date);
  const weekdayName = parts.find((part) => part.type === "weekday")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const weekday =
    weekdayName && Object.hasOwn(WEEKDAYS, weekdayName)
      ? WEEKDAYS[weekdayName as keyof typeof WEEKDAYS]
      : undefined;

  if (weekday === undefined || !hour || !minute) return undefined;
  return { time: `${hour}:${minute}`, weekday };
};

const getLocalWallClockSlot = (value: string): KickoffSlot | undefined => {
  if (EXPLICIT_OFFSET_PATTERN.test(value)) {
    return getAbsoluteKickoffSlot(value);
  }

  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) return undefined;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59;

  if (!isValid) return undefined;

  return {
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    weekday: date.getUTCDay(),
  };
};

const getKickoffSlot = (match: ApiMatch): KickoffSlot | undefined => {
  if (match.matchDateTimeUTC) {
    const utcSlot = getAbsoluteKickoffSlot(match.matchDateTimeUTC, true);
    if (utcSlot) return utcSlot;
  }

  return match.matchDateTime
    ? getLocalWallClockSlot(match.matchDateTime)
    : undefined;
};

const isSupportedSeason = (season: number | undefined) => {
  return (
    typeof season === "number" &&
    Number.isInteger(season) &&
    season >= RIGHTS_CYCLE_START &&
    season <= RIGHTS_CYCLE_END
  );
};

const isSupportedChampionsLeagueSeason = (season: number | undefined) => {
  return season === 2025 || season === 2026;
};

const isSameInstant = (left: string | undefined, right: string) => {
  if (!left) return false;
  const leftTimestamp = Date.parse(normalizeUtcDateTime(left));
  const rightTimestamp = Date.parse(normalizeUtcDateTime(right));
  return (
    !Number.isNaN(leftTimestamp) &&
    !Number.isNaN(rightTimestamp) &&
    leftTimestamp === rightTimestamp
  );
};

const matchesOverrideSignature = (
  competitionId: LeagueKey,
  match: ApiMatch,
  override: ManualBroadcastOverride,
) => {
  return (
    competitionId === override.competitionId &&
    match.matchID === override.matchId &&
    match.leagueSeason === override.season &&
    match.team1?.teamId === override.homeTeamId &&
    match.team2?.teamId === override.awayTeamId &&
    isSameInstant(match.matchDateTimeUTC, override.kickoffUtc)
  );
};

const getManualResolution = (
  competitionId: LeagueKey,
  match: ApiMatch,
  overrides: readonly ManualBroadcastOverride[],
): MatchBroadcastResolution | undefined => {
  if (typeof match.matchID !== "number") return undefined;

  const matchKey = `${competitionId}:${match.matchID}`;
  const override = overrides.find((item) => item.matchKey === matchKey);
  if (!override || !matchesOverrideSignature(competitionId, match, override)) {
    return undefined;
  }

  const broadcasts = uniqueBroadcasts(
    override.broadcasters.map(({ broadcasterId, coverage }) =>
      createBroadcast(broadcasterId, coverage, {
        note: override.note,
        sourceUrl: override.sourceUrl,
        verified: true,
      }),
    ),
  );

  return {
    broadcasts,
    status: broadcasts.length > 0 ? "available" : "unconfirmed",
  };
};

const isSlot = (
  slot: KickoffSlot | undefined,
  weekday: number | number[],
  time: string,
) => {
  if (!slot || slot.time !== time) return false;
  return Array.isArray(weekday)
    ? weekday.includes(slot.weekday)
    : slot.weekday === weekday;
};

const getBundesligaBroadcasts = (match: ApiMatch): MatchBroadcast[] => {
  const slot = getKickoffSlot(match);
  const broadcasts: MatchBroadcast[] = [];

  if (isSlot(slot, 5, "20:30")) {
    broadcasts.push(...createSkyIndividualBroadcasts());

    if (match.group?.groupOrderID === 1) {
      broadcasts.push(createBroadcast("sat1", "individual"));
    }
  } else if (isSlot(slot, 6, "15:30")) {
    broadcasts.push(
      ...createSkyIndividualBroadcasts(),
      createBroadcast("dazn", "conference"),
    );
  } else if (isSlot(slot, 6, "18:30")) {
    broadcasts.push(...createSkyIndividualBroadcasts());
  } else if (
    isSlot(slot, 0, "15:30") ||
    isSlot(slot, 0, "17:30") ||
    isSlot(slot, 0, "19:30")
  ) {
    broadcasts.push(createBroadcast("dazn", "individual"));
  } else if (isSlot(slot, [2, 3], "18:30")) {
    broadcasts.push(...createSkyIndividualBroadcasts());
  } else if (isSlot(slot, [2, 3], "20:30")) {
    broadcasts.push(
      ...createSkyIndividualBroadcasts(),
      createBroadcast("dazn", "conference"),
    );
  } else if (isSlot(slot, 4, "20:30")) {
    broadcasts.push(...createSkyIndividualBroadcasts());
  }

  return uniqueBroadcasts(broadcasts);
};

const getSecondBundesligaBroadcasts = (match: ApiMatch): MatchBroadcast[] => {
  const slot = getKickoffSlot(match);
  const broadcasts = createSkyIndividualBroadcasts();

  if (isSlot(slot, 5, "20:30") && match.group?.groupOrderID === 1) {
    broadcasts.push(createBroadcast("sat1", "individual"));
  }

  if (isSlot(slot, 6, "20:30")) {
    broadcasts.push(
      createBroadcast("rtl-nitro", "individual", {
        note: "Genauer Free-TV-Sender folgt",
      }),
      createBroadcast("rtl-plus", "individual"),
    );
  }

  return uniqueBroadcasts(broadcasts);
};

const getChampionsLeagueBroadcasts = (match: ApiMatch): MatchBroadcast[] => {
  const slot = getKickoffSlot(match);

  if (!slot) return [];

  // Prime Video chooses one exclusive Tuesday match. OpenLigaDB does not say
  // which one, so Tuesday cards show both possible services until a verified
  // manual override replaces the pair with the exact assignment.
  if (slot.weekday === 2) {
    const note = "Genaue Dienstag-Zuordnung noch nicht bestätigt";
    return uniqueBroadcasts([
      createBroadcast("prime-video", "individual", {
        note,
        sourceUrl: UCL_RIGHTS_SOURCE,
      }),
      createBroadcast("dazn", "individual", {
        note,
        sourceUrl: UCL_RIGHTS_SOURCE,
      }),
    ]);
  }

  return [
    createBroadcast("dazn", "individual", {
      sourceUrl: UCL_RIGHTS_SOURCE,
    }),
  ];
};

export const getMatchBroadcasts = ({
  competitionId,
  manualOverrides = DEFAULT_MANUAL_OVERRIDES,
  match,
}: {
  competitionId: LeagueKey;
  manualOverrides?: readonly ManualBroadcastOverride[];
  match: ApiMatch;
}): MatchBroadcastResolution => {
  const manualResolution = getManualResolution(
    competitionId,
    match,
    manualOverrides,
  );
  if (manualResolution) return manualResolution;

  if (
    !isSupportedBroadcastLeague(competitionId) ||
    (competitionId === "cl"
      ? !isSupportedChampionsLeagueSeason(match.leagueSeason)
      : !isSupportedSeason(match.leagueSeason))
  ) {
    return { broadcasts: [], status: "unsupported" };
  }

  const broadcasts =
    competitionId === "bl1"
      ? getBundesligaBroadcasts(match)
      : competitionId === "bl2"
        ? getSecondBundesligaBroadcasts(match)
        : getChampionsLeagueBroadcasts(match);

  return {
    broadcasts,
    status: broadcasts.length > 0 ? "available" : "unconfirmed",
  };
};
