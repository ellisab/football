import { NextResponse } from "next/server";
import {
  getLiveDiscoveryData,
  type LivePageData,
} from "@/features/live/server/get-live-page-data";

const HEALTHY_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
};

const PARTIAL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30",
};

const FAILED_CACHE_HEADERS = {
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

export async function GET() {
  try {
    return buildLiveScopesResponse(await getLiveDiscoveryData());
  } catch (error) {
    console.warn("[OpenLigaDB] live scope discovery failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      event: "live_scope_discovery_failed",
    });

    return NextResponse.json(
      { error: "Live schedule discovery failed." },
      {
        headers: FAILED_CACHE_HEADERS,
        status: 503,
      },
    );
  }
}
