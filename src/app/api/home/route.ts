import { NextRequest, NextResponse } from "next/server";
import { getHomeSnapshot } from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? undefined;
  const season = request.nextUrl.searchParams.get("season") ?? undefined;
  const snapshot = await getHomeSnapshot(
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
  );

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${OPENLIGADB_CACHE_SECONDS.homeSnapshot}, stale-while-revalidate=${OPENLIGADB_CACHE_SECONDS.staleWhileRevalidate}`,
    },
  });
}
