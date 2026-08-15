import {
  getTableSnapshot,
  TableSnapshotError,
} from "@footballleagues/core/home";
import { type NextRequest, NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  const params = {
    league: request.nextUrl.searchParams.get("league") ?? undefined,
    season: request.nextUrl.searchParams.get("season") ?? undefined,
  };

  try {
    const snapshot = await getTableSnapshot(params);

    return NextResponse.json(snapshot, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const status =
      error instanceof TableSnapshotError
        ? error.status
        : ((error as { status?: number } | undefined)?.status ?? 500);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Table data could not be loaded.",
      },
      { status, headers: NO_STORE_HEADERS },
    );
  }
}
