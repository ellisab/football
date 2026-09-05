import { NextResponse } from "next/server";
import { getLiveDiscoveryData } from "@/features/live/server/get-live-page-data";
import { buildLiveScopesResponse, FAILED_CACHE_HEADERS } from "./response";

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
