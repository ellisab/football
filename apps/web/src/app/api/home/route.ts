import { NextRequest, NextResponse } from "next/server";
import { getHomeSnapshot } from "@footballleagues/core/home";

const REVALIDATE_SECONDS = 60;

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
          revalidate: REVALIDATE_SECONDS,
        },
      },
    }
  );

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`,
    },
  });
}
