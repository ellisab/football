import { NextRequest, NextResponse } from "next/server";
import { getHomeSnapshot } from "@footballleagues/core/home";
import { isLeagueKey } from "@footballleagues/core/leagues";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import {
  IncompleteSnapshotError,
  requireCacheableHomeSnapshot,
} from "@/features/home/server/home-snapshot-cache-policy";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? undefined;
  const season = request.nextUrl.searchParams.get("season") ?? undefined;

  if (league && !isLeagueKey(league)) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const snapshot = requireCacheableHomeSnapshot(
      await getHomeSnapshot(
        {
          league,
          season,
        },
        {
          requestOptions: {
            next: {
              revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot,
            },
          },
        }
      )
    );

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${OPENLIGADB_CACHE_SECONDS.homeSnapshot}, stale-while-revalidate=${OPENLIGADB_CACHE_SECONDS.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    const upstreamStatus = (error as { status?: number } | undefined)?.status;
    const status =
      upstreamStatus === 429
        ? 429
        : error instanceof IncompleteSnapshotError
        ? 502
        : typeof upstreamStatus === "number" &&
            upstreamStatus >= 400 &&
            upstreamStatus <= 599
          ? upstreamStatus
          : 500;

    return NextResponse.json(
      {
        error:
          error instanceof IncompleteSnapshotError
            ? "Home fixture data could not be loaded completely."
            : error instanceof Error
              ? error.message
              : "Home data could not be loaded.",
      },
      {
        status,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}
