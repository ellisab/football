import { NextRequest, NextResponse } from "next/server";
import {
  getMatchdaySnapshot,
  MatchdaySnapshotError,
} from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? undefined;
  const season = request.nextUrl.searchParams.get("season") ?? undefined;
  const group = request.nextUrl.searchParams.get("group") ?? undefined;

  try {
    const snapshot = await getMatchdaySnapshot(
      {
        group,
        league,
        season,
      },
      {
        requestOptions: {
          next: {
            revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday,
          },
        },
      }
    );

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${OPENLIGADB_CACHE_SECONDS.liveMatchday}, stale-while-revalidate=${OPENLIGADB_CACHE_SECONDS.matchday}`,
      },
    });
  } catch (error) {
    const status =
      error instanceof MatchdaySnapshotError
        ? error.status
        : ((error as { status?: number } | undefined)?.status ?? 500);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Matchday data could not be loaded.",
      },
      {
        status,
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  }
}
