import { NextRequest, NextResponse } from "next/server";
import {
  getImageRequestHeaders,
  isAllowedImageHost,
  normalizeIconUrl,
} from "@footballleagues/core/teams";

const CACHE_SECONDS = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? undefined;
  const normalizedUrl = normalizeIconUrl(rawUrl, {
    convertWikimediaSvgToPng: false,
    forceHttps: true,
  });

  if (!normalizedUrl || !isAllowedImageHost(normalizedUrl)) {
    return new NextResponse("Unsupported image host", {
      status: 404,
    });
  }

  const upstreamResponse = await fetch(normalizedUrl, {
    headers: getImageRequestHeaders(normalizedUrl),
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  if (!upstreamResponse.ok) {
    return new NextResponse("Image upstream failed", {
      status: upstreamResponse.status === 404 ? 404 : 502,
    });
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 7}`,
      "Content-Type":
        upstreamResponse.headers.get("content-type") ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
