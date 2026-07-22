import { NextRequest, NextResponse } from "next/server";
import {
  MatchdaySnapshotError,
} from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import {
  getMatchdayRetrySeconds,
  loadMatchdayWithBackoff,
  MatchdayRefreshBackoffError,
} from "@/features/football/server/matchday-refresh-cache";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const getSharedCacheHeaders = ({
  retryAt,
  stale,
}: {
  retryAt?: number;
  stale: boolean;
}) => {
  const maxAge = stale
    ? getMatchdayRetrySeconds(retryAt)
    : OPENLIGADB_CACHE_SECONDS.liveMatchday;

  return {
    "Cache-Control": `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=10`,
    ...(stale ? { "Retry-After": String(maxAge) } : {}),
  };
};

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? undefined;
  const season = request.nextUrl.searchParams.get("season") ?? undefined;
  const group = request.nextUrl.searchParams.get("group") ?? undefined;

  try {
    const snapshot = await loadMatchdayWithBackoff({
      group,
      league,
      season,
    });

    return NextResponse.json(snapshot, {
      headers: getSharedCacheHeaders({
        retryAt: snapshot.retryAt,
        stale: snapshot.refreshState === "stale",
      }),
    });
  } catch (error) {
    const status =
      error instanceof MatchdayRefreshBackoffError
        ? error.status
        : error instanceof MatchdaySnapshotError
        ? error.status
        : ((error as { status?: number } | undefined)?.status ?? 500);
    const shouldShareFailure = status === 429 || status >= 500;
    const retryAt =
      error instanceof MatchdayRefreshBackoffError
        ? error.retryAt
        : undefined;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Matchday data could not be loaded.",
      },
      {
        status,
        headers: shouldShareFailure
          ? getSharedCacheHeaders({ retryAt, stale: true })
          : NO_STORE_HEADERS,
      }
    );
  }
}
