# OpenLigaDB Caching And Polling Plan

## Goal

Reduce OpenLigaDB traffic while keeping live and recently changed football data fresh.
The app should avoid refetching large match payloads when nothing changed, cache slow-moving data for much longer, and only poll the currently relevant live matchday.

## Current Shape

The OpenLigaDB access layer is centered around:

- `packages/core/src/openligadb/client.ts`
- `packages/core/src/openligadb/data-source.ts`
- `packages/core/src/home/data-source.ts`
- `packages/core/src/home/get-home-snapshot.ts`
- `src/features/home/server/get-home-page-data.ts`
- `src/app/api/home/route.ts`

Today, the app mostly applies a broad 60-second cache policy around the home snapshot and API route. That is simple, but it treats league metadata, groups, tables, teams, matchdays, and live data as if they all change at the same speed.

## Proposed Cache Policy

Use endpoint-specific TTLs.

| Data | Endpoint shape | Suggested TTL | Notes |
| --- | --- | ---: | --- |
| Available leagues | `/getavailableleagues`, `/getavailableleagues/{season}` | 12-24h | Changes rarely. |
| Groups / matchdays | `/getavailablegroups/{league}/{season}` | 12-24h | Usually stable once season data exists. |
| Teams | `/getavailableteams/{league}/{season}` | 24h-7d | Stable for most app behavior. |
| Tables | `/getbltable/{league}/{season}` | 1-6h | Can refresh faster after active matchdays. |
| Current group | `/getcurrentgroup/{league}` | 5-15m | Small payload, controls active matchday. |
| Matchday data | `/getmatchdata/{league}/{season}/{groupOrderId}` | 5-15m | Guard large fetches with last-change checks. |
| Live matchday data | same matchday endpoint | 30-60s check, fetch only on change | Poll only visible active matchday. |
| Whole-season matches | `/getmatchdata/{league}/{season}` | 6-24h | Avoid for live polling; use only where needed. |
| World Cup groups/teams/all matches | grouped endpoints | 6-24h normally, shorter near live windows | Keep World Cup discovery stable. |

## Add `getlastchangedate`

OpenLigaDB exposes a small change timestamp endpoint for matchdays:

```txt
/getlastchangedate/{leagueShortcut}/{season}/{groupOrderId}
```

Example:

```txt
/getlastchangedate/bl1/2025/1
```

Add it to the core client and data-source contract:

```ts
getLastChangeDate(
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: HomeRequestOptions
): Promise<string>;
```

Then use it before fetching larger matchday data.

```ts
const lastChanged = await dataSource.getLastChangeDate(
  leagueShortcut,
  season,
  groupOrderId,
  options
);

const cached = await matchdayCache.get(cacheKey);

if (cached?.lastChanged === lastChanged) {
  return cached.matches;
}

const matches = await dataSource.getMatchdayResults(
  leagueShortcut,
  season,
  groupOrderId,
  options
);

await matchdayCache.set(cacheKey, { lastChanged, matches }, ttl);
return matches;
```

In Next.js, this can also be modeled by making `lastChanged` part of the cache key for the expensive matchday fetch. The app still calls the tiny last-change endpoint, but avoids refetching the full match list until the timestamp changes.

## Retry And Backoff

Update `fetchJson` in `packages/core/src/openligadb/client.ts`.

Retry only transient failures:

- `429 Too Many Requests`
- `500`
- `502`
- `503`
- `504`

Do not retry:

- `400`
- `401`
- `403`
- `404`
- invalid JSON or schema issues unless they are clearly transient

Behavior:

- Maximum 2-3 retries.
- Use `Retry-After` when OpenLigaDB sends it.
- Otherwise use exponential backoff with jitter.
- Keep the existing per-attempt timeout.
- Preserve the response status on the thrown error.

Example timing:

```txt
attempt 1: immediate
attempt 2: 300-600ms later
attempt 3: 900-1500ms later
attempt 4: 2000-3000ms later
```

## Live Polling

Do not poll the full home overview during live matches.

Add a narrow API route:

```txt
/api/matchday?league=bl1&season=2026&group=1
```

That route should:

1. Validate the requested league, season, and group.
2. Resolve the effective OpenLigaDB shortcut.
3. Call `getlastchangedate`.
4. Return cached matchday data when unchanged.
5. Fetch the matchday only when the timestamp changed.

The UI should poll this route only when the currently visible matchday has a live match. Polling should stop when all matches in that matchday are finished or when the user leaves the relevant view.

## Snapshot Loading Changes

For the home snapshot:

1. Keep league discovery and season/group metadata on long TTLs.
2. Keep tables on medium TTLs.
3. Resolve the current matchday with a short TTL.
4. Load only the primary current matchday and next relevant matchday.
5. Avoid loading every league or season during live polling.

For `/tables`:

1. Use cached tables and teams.
2. Do not fetch matchday data unless it is needed for table context.
3. Keep unsupported competitions filtered before rendering.

For `/teams`:

1. Use cached teams, tables, and a small set of relevant matchdays.
2. Avoid whole-season match fetches for every request unless a route genuinely needs them.

## Implementation Phases

### Phase 1: Safer OpenLigaDB Client

- Add retry/backoff to `fetchJson`.
- Add `getLastChangeDate` to the client.
- Extend `FootballDataSource`.
- Update tests with mocked `429`, `5xx`, and non-retryable `404`.

### Phase 2: Endpoint TTLs

- Replace one global `REVALIDATE_SECONDS` with named TTL constants.
- Apply long TTLs to leagues, groups, teams, and tables.
- Keep current group and matchday data short.
- Keep public `Cache-Control` headers aligned with the underlying data freshness.

### Phase 3: Last-Changed Matchday Cache

- Add a matchday loader that checks `getlastchangedate` first.
- Use the loader in `getHomeSnapshot` wherever it currently calls `getMatchdayResults`.
- Keep test data-source support for last-change behavior.

### Phase 4: Narrow Live Polling Route

- Add `/api/matchday`.
- Poll only the visible active matchday.
- Stop polling when there are no live matches.
- Keep the overview route stable and non-chatty.

### Phase 5: Observability

- Log retry counts, final status, and endpoint category.
- Track cache hit/miss for matchday last-change checks.
- Add lightweight diagnostics for unexpected OpenLigaDB spikes.

## Tests

Add tests for:

- Retry happens for `429` and `5xx`.
- Retry does not happen for `404`.
- `Retry-After` is honored.
- Matchday data is not refetched when `lastChanged` is unchanged.
- Matchday data is refetched when `lastChanged` changes.
- Live polling endpoint loads only one requested matchday.
- Overview route does not fan out across all leagues during live polling.

## Rollout Notes

Ship in small steps.

1. Client retry/backoff is low-risk and useful immediately.
2. Endpoint TTL changes should be verified against `/`, `/today`, `/tables`, `/teams`, and match detail pages.
3. Last-change caching should be introduced behind tests before the live polling route starts relying on it.
4. The live polling route can be added without changing the full overview route first, then wired into the UI after it is stable.

## Expected Result

The app should make far fewer OpenLigaDB requests:

- Stable metadata is reused for hours or days.
- Tables refresh often enough for normal browsing without hammering the API.
- Matchday data is only refetched when OpenLigaDB reports a real change.
- Live views poll a tiny, focused path instead of refreshing all competitions.
- Transient OpenLigaDB failures are handled with controlled retries instead of immediate user-visible failures.
