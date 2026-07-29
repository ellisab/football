import {
  getImageRequestHeaders,
  isAllowedImageHost,
  isSvgUrl,
  normalizeIconUrl,
} from "@footballleagues/core/teams";
import { type NextRequest, NextResponse } from "next/server";

const CACHE_SECONDS = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? undefined;
  const normalizedUrl = normalizeIconUrl(rawUrl, {
    convertWikimediaSvgToPng: false,
    forceHttps: true,
  });

  if (!normalizedUrl || !isAllowedImageHost(normalizedUrl)) {
    return new NextResponse("Bildquelle wird nicht unterstützt", {
      status: 404,
    });
  }

  if (isSvgUrl(normalizedUrl)) {
    return new NextResponse("Bildtyp wird nicht unterstützt", {
      status: 415,
    });
  }

  const upstreamResponse = await fetch(normalizedUrl, {
    headers: getImageRequestHeaders(normalizedUrl),
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  if (!upstreamResponse.ok) {
    return new NextResponse("Bildquelle konnte nicht geladen werden", {
      status: upstreamResponse.status === 404 ? 404 : 502,
    });
  }

  const upstreamContentType = upstreamResponse.headers.get("content-type");
  const normalizedContentType = upstreamContentType?.toLowerCase() ?? "";

  if (
    normalizedContentType.includes("image/svg+xml") ||
    normalizedContentType.includes("text/html") ||
    normalizedContentType.includes("application/xhtml+xml")
  ) {
    return new NextResponse("Bildtyp wird nicht unterstützt", {
      status: 415,
    });
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 7}`,
      "Content-Type": upstreamContentType ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
