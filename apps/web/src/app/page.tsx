import type { CSSProperties } from "react";
import Image from "next/image";
import { Badge } from "@footballleagues/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@footballleagues/ui/card";
import { Separator } from "@footballleagues/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@footballleagues/ui/table";
import {
  getAvailableLeagues,
  getCurrentGroup,
  getFinalResult,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
  type ApiLeague,
  type ApiMatch,
} from "@footballleagues/core/openligadb";
import { LeagueSelector, type LeagueOption } from "@/components/league-selector";

const DEFAULT_LEAGUE = "bl1";
const LEAGUE_GROUPS = [
  { key: "bl1", label: "Bundesliga", nameMatch: ["bundesliga"], shortcutMatch: ["bl1"] },
  { key: "bl2", label: "Zweite Bundesliga", nameMatch: ["2. bundesliga", "2. fussball-bundesliga", "2. fußball-bundesliga"], shortcutMatch: ["bl2"] },
  { key: "dfb", label: "DFB-Pokal", nameMatch: ["dfb-pokal", "dfb pokal"], shortcutMatch: ["dfb"] },
  { key: "cl", label: "Champions League", nameMatch: ["champions league"], shortcutMatch: ["cl"] },
];
const LEAGUE_THEMES: Record<
  string,
  { accent: string; accentSoft: string; glow: string }
> = {
  bl1: { accent: "#facc15", accentSoft: "rgba(250, 204, 21, 0.15)", glow: "rgba(250, 204, 21, 0.25)" },
  bl2: { accent: "#38bdf8", accentSoft: "rgba(56, 189, 248, 0.15)", glow: "rgba(56, 189, 248, 0.25)" },
  pl: { accent: "#22c55e", accentSoft: "rgba(34, 197, 94, 0.15)", glow: "rgba(34, 197, 94, 0.25)" },
  cl: { accent: "#0ea5e9", accentSoft: "rgba(14, 165, 233, 0.15)", glow: "rgba(14, 165, 233, 0.25)" },
  el: { accent: "#fb923c", accentSoft: "rgba(251, 146, 60, 0.15)", glow: "rgba(251, 146, 60, 0.25)" },
  dfb: { accent: "#f97316", accentSoft: "rgba(249, 115, 22, 0.15)", glow: "rgba(249, 115, 22, 0.25)" },
};

const REVALIDATE = { next: { revalidate: 60 } };

const kickoffFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatKickoff = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return kickoffFormatter.format(date);
};

const buildGroupEntries = (leagues: ApiLeague[]) => {
  const map = new Map<string, ApiLeague[]>();
  for (const group of LEAGUE_GROUPS) {
    map.set(group.key, []);
  }

  for (const league of leagues) {
    if (!league.leagueShortcut || !league.leagueSeason || !isFootball(league)) continue;
    for (const group of LEAGUE_GROUPS) {
      if (matchesGroup(league, group.key)) {
        map.get(group.key)?.push(league);
        break;
      }
    }
  }

  return map;
};

const getSeasonValue = (league: ApiLeague) => {
  const raw = league.leagueSeason;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const resolveSeasons = (entries: ApiLeague[]) => {
  const seasons = entries
    .map((league) => getSeasonValue(league))
    .filter((season) => season > 0)
    .sort((a, b) => b - a);

  return Array.from(new Set(seasons));
};

const keepLatestSeasonOnly = (entries: ApiLeague[]) => {
  const seasons = resolveSeasons(entries);
  if (seasons.length === 0) return entries;
  const latest = seasons[0];
  return entries.filter((entry) => getSeasonValue(entry) === latest);
};


const normalize = (value?: string) => (value ?? "").toLowerCase();

const isFootball = (league: ApiLeague) => {
  const name = normalize(league.sport?.sportName);
  return name.includes("fußball") || name.includes("fussball") || name.includes("football");
};

const matchesGroup = (league: ApiLeague, groupKey: string) => {
  const group = LEAGUE_GROUPS.find((item) => item.key === groupKey);
  if (!group) return false;

  const leagueName = normalize(league.leagueName);
  const leagueShortcut = normalize(league.leagueShortcut);

  const nameHit = group.nameMatch.some((needle) => leagueName.includes(needle));
  const shortcutHit = group.shortcutMatch.some((needle) => leagueShortcut.startsWith(needle));

  return nameHit || shortcutHit;
};

const pickEntryForSeason = (entries: ApiLeague[], season: number) => {
  const candidates = entries.filter((entry) => getSeasonValue(entry) === season);
  if (candidates.length === 0) return undefined;

  return candidates.sort((a, b) => {
    const aShortcut = a.leagueShortcut ?? "";
    const bShortcut = b.leagueShortcut ?? "";
    return aShortcut.length - bShortcut.length || aShortcut.localeCompare(bShortcut);
  })[0];
};

const resolveTheme = (shortcut: string) => {
  return (
    LEAGUE_THEMES[shortcut] ?? {
      accent: "#e2e8f0",
      accentSoft: "rgba(226, 232, 240, 0.12)",
      glow: "rgba(226, 232, 240, 0.18)",
    }
  );
};

const ALLOWED_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "i.imgur.com",
  "www.bundesliga-reisefuehrer.de",
  "www.bundesliga-logos.com",
  "www.bundesliga.com",
  "www.bundesliga.de",
]);

const isAllowedImageHost = (iconUrl?: string) => {
  if (!iconUrl) return false;
  try {
    const { hostname } = new URL(iconUrl);
    return ALLOWED_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

const normalizeIconUrl = (iconUrl?: string) => {
  if (!iconUrl) return undefined;
  try {
    const url = new URL(iconUrl);
    if (url.protocol === "http:" && ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
    }
    return url.toString();
  } catch {
    return iconUrl;
  }
};

const renderTeamBadge = (name?: string, iconUrl?: string) => {
  const normalizedUrl = normalizeIconUrl(iconUrl);
  if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
    return (
      <Image
        src={normalizedUrl}
        alt={name ?? "Team crest"}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full bg-white/10 object-contain"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
      {(name ?? "T").slice(0, 1)}
    </div>
  );
};

const renderMatchCard = (match: ApiMatch) => {
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "–";
  const goals = match.goals ?? [];

  return (
    <div
      key={match.matchID ?? `${match.team1?.teamId}-${match.team2?.teamId}`}
      className="grid w-full min-w-0 max-w-full min-h-[132px] gap-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>{formatKickoff(match.matchDateTimeUTC ?? match.matchDateTime)}</span>
        <span>{match.matchIsFinished ? "Final" : "Scheduled"}</span>
      </div>
      <div className="grid gap-2 text-sm font-semibold text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {renderTeamBadge(match.team1?.teamName, match.team1?.teamIconUrl)}
            <span className="min-w-0 truncate leading-tight">
              {match.team1?.teamName ?? "Home"}
            </span>
          </div>
          <span className="font-display text-base tracking-[0.2em]">{score}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {renderTeamBadge(match.team2?.teamName, match.team2?.teamIconUrl)}
          <span className="min-w-0 truncate leading-tight">
            {match.team2?.teamName ?? "Away"}
          </span>
        </div>
      </div>
      {goals.length > 0 ? (
        <div className="grid gap-1 text-center text-xs text-slate-300">
          {goals.map((goal, index) => (
            <div key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}>
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Goal"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const formatSeasonRange = (season: number | undefined) => {
  if (!season || season <= 0) return "";
  return `${season}/${season + 1}`;
};

const getCurrentSeasonYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? year : year - 1;
};

const isKnockoutGroup = (name?: string) => {
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

const sortGoals = (match: ApiMatch) => {
  if (!match.goals || match.goals.length < 2) return match;
  return {
    ...match,
    goals: [...match.goals].sort(
      (a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)
    ),
  };
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const params = await searchParams;
  const availableLeagues = await getAvailableLeagues(REVALIDATE);
  const groupedLeagues = buildGroupEntries(availableLeagues);
  const normalizedGroups = new Map(
    Array.from(groupedLeagues.entries()).map(([key, entries]) => [
      key,
      key === "bl2" ? keepLatestSeasonOnly(entries) : entries,
    ])
  );

  const availableGroupKeys = LEAGUE_GROUPS.map((group) => group.key).filter(
    (key) => (normalizedGroups.get(key)?.length ?? 0) > 0
  );
  const fallbackLeague = availableGroupKeys[0] ?? DEFAULT_LEAGUE;
  const requestedLeague = params.league ?? fallbackLeague;
  const resolvedLeague = availableGroupKeys.includes(requestedLeague)
    ? requestedLeague
    : fallbackLeague;

  const leagueEntries = normalizedGroups.get(resolvedLeague) ?? [];
  const seasonOptions = resolveSeasons(leagueEntries);
  const currentSeasonYear = getCurrentSeasonYear();
  const forcedSeason = resolvedLeague === "bl2" ? 2025 : undefined;
  const resolvedSeason = forcedSeason ?? seasonOptions[0] ?? currentSeasonYear;

  const entryForSeason = pickEntryForSeason(leagueEntries, resolvedSeason);
  const effectiveShortcut = resolvedLeague === "bl2" ? "bl2" : entryForSeason?.leagueShortcut ?? resolvedLeague;

  const currentGroupPromise = getCurrentGroup(effectiveShortcut, REVALIDATE);
  const tablePromise = getTable(effectiveShortcut, resolvedSeason, REVALIDATE);
  const groupsPromise =
    resolvedLeague === "cl"
      ? getGroups(effectiveShortcut, resolvedSeason, REVALIDATE)
      : null;
  const playoffMatchesPromise =
    resolvedLeague === "cl"
      ? getMatchdayResults("ucl", resolvedSeason, 9, REVALIDATE)
      : Promise.resolve([]);
  const [currentGroupResult, tableResult, groupsResult, playoffResult] =
    await Promise.allSettled([
      currentGroupPromise,
      tablePromise,
      groupsPromise ?? Promise.resolve([]),
      playoffMatchesPromise,
    ]);
  const dataErrors: string[] = [];

  const currentGroup =
    currentGroupResult.status === "fulfilled"
      ? currentGroupResult.value
      : (dataErrors.push("current group"), null);
  const table =
    tableResult.status === "fulfilled"
      ? tableResult.value
      : (dataErrors.push("table"), []);
  const groups =
    groupsResult.status === "fulfilled"
      ? groupsResult.value
      : (() => {
          const reason = groupsResult.reason as { status?: number } | undefined;
          if (reason?.status === 404) return [];
          dataErrors.push("groups");
          return [];
        })();
  const playoffMatches =
    playoffResult.status === "fulfilled"
      ? playoffResult.value.map(sortGoals)
      : (dataErrors.push("playoffs"), []);

  const matchdayPromise = currentGroup?.groupOrderID
    ? getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        currentGroup.groupOrderID,
        REVALIDATE
      )
    : Promise.resolve([]);
  const [matchdayResult] = await Promise.allSettled([matchdayPromise]);
  const matches =
    matchdayResult.status === "fulfilled"
      ? matchdayResult.value.map(sortGoals)
      : (dataErrors.push("matchday"), []);

  const knockoutGroups = Array.isArray(groups)
    ? groups.filter((group) => isKnockoutGroup(group.groupName))
    : [];

  const knockoutRounds = await Promise.all(
    knockoutGroups.map(async (group) => {
      if (!group.groupOrderID) return { group, matches: [] };
      const roundMatches = await getMatchesByGroup(
        effectiveShortcut,
        resolvedSeason,
        group.groupOrderID,
        REVALIDATE
      );
      return { group, matches: roundMatches.map(sortGoals) };
    })
  );

  const bracketMatches =
    playoffMatches.length > 0
      ? [
          {
            group: { groupName: "Playoffs", groupID: 9 },
            matches: playoffMatches,
          },
        ]
      : knockoutRounds;

  const leagueOptions: LeagueOption[] = availableGroupKeys.map((key) => {
    const groupConfig = LEAGUE_GROUPS.find((group) => group.key === key);
    const entries = normalizedGroups.get(key) ?? [];
    const seasons = key === "bl2" ? [2025] : resolveSeasons(entries);
    const latestSeason = seasons[0];
    const latestEntry =
      latestSeason !== undefined ? pickEntryForSeason(entries, latestSeason) : undefined;
    const baseLabel = groupConfig?.label ?? latestEntry?.leagueName ?? key.toUpperCase();
    const seasonLabel = formatSeasonRange(latestSeason);
    const displayLabel = seasonLabel ? `${baseLabel} ${seasonLabel}` : baseLabel;

    return {
      shortcut: key,
      label: displayLabel.trim(),
      seasons,
    };
  });

  const activeLeagueLabel =
    leagueOptions.find((option) => option.shortcut === resolvedLeague)?.label ??
    LEAGUE_GROUPS.find((group) => group.key === resolvedLeague)?.label ??
    resolvedLeague.toUpperCase();

  const theme = resolveTheme(resolvedLeague);
  const themeStyles = {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--accent-glow": theme.glow,
  } as CSSProperties;
  const errorLabelMap: Record<string, string> = {
    "current group": "current group",
    matchday: "matchday results",
    table: "table",
    groups: "groups",
    playoffs: "playoff matches",
  };
  const visibleErrors = Array.from(new Set(dataErrors)).map(
    (key) => errorLabelMap[key] ?? key
  );

  return (
    <div
      style={themeStyles}
      className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(12,74,110,0.12),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(190,24,93,0.08),_transparent_40%),linear-gradient(135deg,_#0b1020,_#101827_40%,_#0f172a)] text-slate-100"
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-8 sm:gap-10 sm:px-8 sm:pb-20 sm:pt-14">
        <section className="grid gap-6">
          <Badge className="w-fit border border-[color:var(--accent-glow)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
            OpenLigaDB Live
          </Badge>
          <div className="grid gap-4">
            <h1 className="font-display text-3xl uppercase tracking-[0.12em] text-slate-100 sm:text-5xl sm:tracking-[0.18em] lg:text-6xl">
              Matchday Atlas
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/80 sm:text-lg">
              Follow the latest matchday results and tables for your favorite leagues,
              refreshed every minute.
            </p>
          </div>
        </section>

        <div className="sticky top-0 z-30 -mx-4 px-4 py-4 sm:-mx-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_0_45px_rgba(15,23,42,0.45)] backdrop-blur sm:px-6">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-300">
              Competition
            </span>
            <LeagueSelector leagues={leagueOptions} currentLeague={resolvedLeague} />
          </div>
        </div>

        <Separator className="bg-white/10" />
        {visibleErrors.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Some data failed to load: {visibleErrors.join(", ")}. Try refreshing.
          </div>
        ) : null}

        {resolvedLeague === "cl" && bracketMatches.length > 0 ? (
          <section className="grid gap-6">
            <Card className="border-white/10 bg-white/5 shadow-[0_0_45px_rgba(15,23,42,0.45)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100 sm:text-2xl">
                  Champions League Bracket
                </CardTitle>
                <CardDescription className="text-slate-200/70">
                  Knockout rounds based on the latest groups data.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                {bracketMatches.map(({ group, matches: roundMatches }) => (
                  <div key={group.groupID ?? group.groupName} className="grid gap-3">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      {group.groupName ?? "Round"}
                    </div>
                    {roundMatches.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                        No matches available yet.
                      </div>
                    ) : (
                      roundMatches.map((match) => renderMatchCard(match))
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section
          className={`grid gap-8 ${
            resolvedLeague === "bl1" ||
            resolvedLeague === "bl2" ||
            resolvedLeague === "cl" ||
            resolvedLeague === "dfb"
              ? ""
              : "lg:grid-cols-[1.3fr_1fr]"
          }`}
        >
          <Card className="border-white/10 bg-white/5 shadow-[0_0_45px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 sm:text-2xl">
                {currentGroup?.groupName ?? "Latest Matchday"}
              </CardTitle>
              <CardDescription className="text-slate-200/70">
                {activeLeagueLabel} · Season {resolvedSeason}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid w-full min-w-0 gap-4">
              {matches.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-slate-200">
                  No match results available yet for this matchday.
                </div>
              ) : (
                matches.map((match) => renderMatchCard(match))
              )}
              {resolvedLeague === "bl1" || resolvedLeague === "bl2" || resolvedLeague === "cl" ? (
                <div className="grid gap-6 pt-2">
                  <Card className="border-white/10 bg-white/5 shadow-[0_0_45px_rgba(15,23,42,0.45)]">
                    <CardHeader>
                      <CardTitle className="text-xl text-slate-100 sm:text-2xl">
                        Table
                      </CardTitle>
                      <CardDescription className="text-slate-200/70">
                        Updated standings for the selected season.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-6">
                      <div className="sm:hidden">
                        <div className="grid gap-2 px-4 pb-2">
                          {table.map((row, index) => (
                            <div
                              key={row.teamInfoId ?? row.teamName}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="w-6 text-white/70">{index + 1}</span>
                                {renderTeamBadge(row.teamName, row.teamIconUrl)}
                                <span className="min-w-0 truncate font-semibold">
                                  {row.teamName}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-300">Pts</div>
                                <div className="text-base font-semibold">{row.points}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="hidden overflow-x-auto px-4 pb-2 sm:block sm:px-0">
                        <Table className="min-w-[640px]">
                          <TableHeader>
                            <TableRow className="border-white/10">
                              <TableHead className="w-12 text-slate-300">Pos</TableHead>
                              <TableHead className="text-slate-300">Team</TableHead>
                              <TableHead className="text-slate-300">MP</TableHead>
                              <TableHead className="text-slate-300">W</TableHead>
                              <TableHead className="text-slate-300">D</TableHead>
                              <TableHead className="text-slate-300">L</TableHead>
                              <TableHead className="text-slate-300">GD</TableHead>
                              <TableHead className="text-right text-slate-300">Pts</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {table.map((row, index) => (
                              <TableRow
                                key={row.teamInfoId ?? row.teamName}
                                className="border-white/5"
                              >
                                <TableCell className="font-semibold text-white/80">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-semibold text-white">
                                  <div className="flex items-center gap-3">
                                    {renderTeamBadge(row.teamName, row.teamIconUrl)}
                                    <span>{row.teamName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-200">{row.matches}</TableCell>
                                <TableCell className="text-slate-200">{row.won}</TableCell>
                                <TableCell className="text-slate-200">{row.draw}</TableCell>
                                <TableCell className="text-slate-200">{row.lost}</TableCell>
                                <TableCell className="text-slate-200">{row.goalDiff}</TableCell>
                                <TableCell className="text-right font-semibold text-white">
                                  {row.points}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {resolvedLeague !== "dfb" &&
            resolvedLeague !== "bl1" &&
            resolvedLeague !== "bl2" &&
            resolvedLeague !== "cl" ? (
              <Card className="border-white/10 bg-white/5 shadow-[0_0_45px_rgba(15,23,42,0.45)]">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-100 sm:text-2xl">
                    Table
                  </CardTitle>
                  <CardDescription className="text-slate-200/70">
                    Updated standings for the selected season.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <div className="overflow-x-auto px-4 pb-2 sm:px-0">
                    <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="w-12 text-slate-300">Pos</TableHead>
                        <TableHead className="text-slate-300">Team</TableHead>
                        <TableHead className="text-slate-300">MP</TableHead>
                        <TableHead className="text-slate-300">W</TableHead>
                        <TableHead className="text-slate-300">D</TableHead>
                        <TableHead className="text-slate-300">L</TableHead>
                        <TableHead className="text-slate-300">GD</TableHead>
                        <TableHead className="text-right text-slate-300">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.map((row, index) => (
                        <TableRow key={row.teamInfoId ?? row.teamName} className="border-white/5">
                          <TableCell className="font-semibold text-white/80">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            <div className="flex items-center gap-3">
                              {renderTeamBadge(row.teamName, row.teamIconUrl)}
                              <span>{row.teamName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-200">{row.matches}</TableCell>
                          <TableCell className="text-slate-200">{row.won}</TableCell>
                          <TableCell className="text-slate-200">{row.draw}</TableCell>
                          <TableCell className="text-slate-200">{row.lost}</TableCell>
                          <TableCell className="text-slate-200">{row.goalDiff}</TableCell>
                          <TableCell className="text-right font-semibold text-white">
                            {row.points}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : null}

          </div>
        </section>

        <footer className="text-sm text-slate-300">
          Data updates every 60 seconds. Built with Next.js + shadcn/ui components.
        </footer>
      </main>
    </div>
  );
}
