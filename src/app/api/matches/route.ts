import { NextRequest, NextResponse } from "next/server";
import {
  getMatchById,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";

const MAX_MATCH_IDS = 14;

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

export async function GET(request: NextRequest) {
  const ids = parseMatchIds(request.nextUrl.searchParams.get("ids"));

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Missing valid match ids." },
      { status: 400 }
    );
  }

  const results = await Promise.allSettled(
    ids.map((id) =>
      getMatchById(id, {
        next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
      })
    )
  );
  const matches = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );

  return NextResponse.json(
    { matches },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${OPENLIGADB_CACHE_SECONDS.liveMatchday}, stale-while-revalidate=${OPENLIGADB_CACHE_SECONDS.matchday}`,
      },
    }
  );
}
