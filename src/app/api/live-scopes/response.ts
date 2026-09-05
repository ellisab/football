import { NextResponse } from "next/server";
import type { LivePageData } from "@/features/live/server/get-live-page-data";

const HEALTHY_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
};

const PARTIAL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30",
};

export const FAILED_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30",
  "Retry-After": "60",
};

export const buildLiveScopesResponse = (data: LivePageData) => {
  if (data.visibleErrors.length === 0) {
    return NextResponse.json(data, { headers: HEALTHY_CACHE_HEADERS });
  }

  if (data.matches.length > 0) {
    return NextResponse.json(data, { headers: PARTIAL_CACHE_HEADERS });
  }

  return NextResponse.json(data, {
    headers: FAILED_CACHE_HEADERS,
    status: 503,
  });
};
