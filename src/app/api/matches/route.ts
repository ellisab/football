import { NextRequest, NextResponse } from "next/server";
import {
  getMatchById,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import { resolveLeagueKey } from "@footballleagues/core/leagues";

const MAX_MATCH_IDS = 14;
const MATCH_LOOKUP_CONCURRENCY = 3;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const parseMatchIds = (value: string | null) => {
  if (!value) return [];

  const seen = new Set<number>();
  const ids: number[] = [];

  for (const part of value.split(",")) {
    const id = Number.parseInt(part.trim(), 10);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;

    seen.add(id);
    ids.push(id);

    if (ids.length >= MAX_MATCH_IDS) break;
  }

  return ids;
};

const getStatusCode = (error: unknown) =>
  (error as { status?: number } | undefined)?.status;

type MatchLookupResult =
  | { status: "fulfilled"; value: Awaited<ReturnType<typeof getMatchById>> }
  | { reason: unknown; status: "rejected" };

const loadMatches = async (ids: readonly number[]) => {
  const results: Array<MatchLookupResult | undefined> = new Array(ids.length);
  let nextIndex = 0;
  let rateLimited = false;

  const worker = async () => {
    while (!rateLimited && nextIndex < ids.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = {
          status: "fulfilled",
          value: await getMatchById(ids[index] as number, {
            next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
          }),
        };
      } catch (reason) {
        results[index] = { reason, status: "rejected" };
        if (getStatusCode(reason) === 429) rateLimited = true;
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(MATCH_LOOKUP_CONCURRENCY, ids.length) },
      worker
    )
  );

  return results.filter(
    (result): result is MatchLookupResult => result !== undefined
  );
};

export async function GET(request: NextRequest) {
  const ids = parseMatchIds(request.nextUrl.searchParams.get("ids"));

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Missing valid match ids." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const results = await loadMatches(ids);
  const loadedMatches = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );
  const matches = loadedMatches.filter((match) => resolveLeagueKey(match));
  const filteredCount = loadedMatches.length - matches.length;
  const failures = results.filter(
    (result): result is Extract<MatchLookupResult, { status: "rejected" }> =>
      result.status === "rejected"
  );
  const failedCount =
    failures.length + (ids.length - results.length) + filteredCount;

  if (matches.length === 0) {
    const statuses = failures.map(({ reason }) => getStatusCode(reason));
    const status = filteredCount > 0
      ? 404
      : statuses.includes(429)
        ? 429
        : statuses.length > 0 && statuses.every((value) => value === 404)
          ? 404
          : 502;

    return NextResponse.json(
      {
        matches: [],
        error: "Match data could not be loaded.",
      },
      {
        status,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  return NextResponse.json(
    { matches },
    {
      headers: {
        "Cache-Control":
          failedCount > 0
            ? NO_STORE_HEADERS["Cache-Control"]
            : `public, max-age=0, s-maxage=${OPENLIGADB_CACHE_SECONDS.liveMatchday}, stale-while-revalidate=${OPENLIGADB_CACHE_SECONDS.matchday}`,
      },
    }
  );
}
