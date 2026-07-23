# OpenLigaDB Caching, Polling, And Backoff Plan

> Status: implemented in the application as of 2026-07-23. Production rollout and
> post-deployment measurement are still required.

## Goals

The caching system should:

- keep active scores reasonably fresh without rebuilding the full site every 45 seconds;
- share upstream work between users instead of polling once per browser;
- fetch a complete matchday only when OpenLigaDB reports that it changed;
- serve a clearly labelled last-known result during transient failures;
- stop repeated failed revalidations from consuming Fluid Active CPU;
- cache metadata, tables, fixtures, and live scores according to how quickly each changes.

The system cannot make scores fresher than OpenLigaDB itself. The healthy-path target is
normally a score update within roughly 30-75 seconds, plus any delay in the upstream data.

## Design Rules

1. Do not use one long global backoff for every football request.
2. Key ordinary failures by league, season, and matchday.
3. Use an origin-wide cooldown only for `429 Too Many Requests`.
4. Keep the overview slow and stable; overlay live scores through a narrow route.
5. Never use `cache: "no-store"` for routine per-viewer score refreshes. Use it only for the
   shared matchday route's blocking last-change/result validation after a CDN miss.
6. Do not sleep inside a function for circuit-breaker backoff. Persist `retryAt` and skip
   upstream work until that time.
7. Treat stale data as stale in the response and UI; never present an old result as freshly
   confirmed.

## Request Flow

```txt
Initial /live request
  -> dedicated getLivePageData loader
  -> shared 60-second computed live-discovery cache
  -> cached current-season competition discovery
  -> cached whole-season schedule per configured competition
  -> local filtering to possibly live and nearest upcoming matches
  -> existing matchday Runtime Cache refresh for active scopes only

Visible /live tab, every 45 seconds
  -> GET /api/matchday?league=...&season=...&group=...
  -> Vercel CDN response cache
  -> regional Vercel Runtime Cache state
  -> blocking, no-store getlastchangedate
  -> blocking, no-store getmatchdata only when lastChanged changed

Visible /live tab, every 5 minutes
  -> GET /api/live-scopes
  -> shared CDN response cache
  -> discover newly relevant matches without rebuilding the home overview
```

The initial `/live` request receives a server-rendered live model, not the home overview.
Tables, standings, full brackets, available-group scans, and broad knockout-round validation
are outside this path. After hydration, the browser updates only relevant matchday payloads.
It does not call `router.refresh()` or rebuild the React Server Component tree on its
45-second interval.

## Cache Layers

| Layer | Scope | Purpose | Current implementation |
| --- | --- | --- | --- |
| Browser state | One visible tab | Display and merge updated scores | Polls active scopes every 45s, rediscovers scopes every 5m, and honors `retryAt`/`Retry-After`. |
| Vercel CDN | Shared per cache location | Avoid a function invocation for every viewer | Caches `/api/matchday` and `/api/live-scopes` responses using `s-maxage`. |
| Vercel Runtime Cache | Per region, project, and environment | Store last-good snapshots and breaker state across function instances | Namespace `football-data-v1`, provided by `@vercel/functions`. |
| Next.js fetch/data cache | Framework cache | Cache stable OpenLigaDB fetches and computed snapshots | Endpoint TTLs plus `unstable_cache` for 60-second live discovery and five-minute home snapshots; the live validation transaction bypasses this layer. |
| Process memory | One warm function instance | Fast local deduplication | 128-entry successful-response LRU, 128-entry matchday LRU, and keyed single-flight. |

Vercel Runtime Cache is regional and ephemeral. It is not a database and does not provide an
atomic lease. Different regions can perform one refresh each, and a first-request burst can
still race across instances. CDN caching and local single-flight limit that exposure.

Outside Vercel, `@vercel/functions` falls back to an in-memory cache. The local warning that
Runtime Cache is unavailable is therefore expected during tests and local builds.

The successful-response LRU applies only to eligible `GET` requests, caps each entry at five
minutes, and is bypassed when request-specific options such as an abort `signal` prevent safe
sharing. It complements, rather than replaces, the framework cache.

## Endpoint TTL Policy

The canonical values live in `packages/core/src/openligadb/cache-policy.ts`.

| Data | Endpoint shape | TTL | Reasoning |
| --- | --- | ---: | --- |
| Available leagues | `/getavailableleagues`, `/getavailableleagues/{season}` | 24h | Discovery data changes rarely. |
| Groups / matchdays | `/getavailablegroups/{league}/{season}` | 24h | Season structure is normally stable. |
| Teams | team endpoints | 3d | Team metadata changes slowly. |
| Tables | `/getbltable/{league}/{season}` | 3h | Useful browsing freshness without live-rate polling. |
| Current group | `/getcurrentgroup/{league}` | 5m | Small control payload that changes around matchdays. |
| Matchday payload | `/getmatchdata/{league}/{season}/{group}` | 10m default | Full payload is guarded by a last-change check. |
| Live matchday validation | last-change and conditional matchday payload | `no-store` inside the route | Prevents an expired marker or payload from being accepted as a fresh validation result; the route response remains CDN-cached for 30s. |
| Whole-season matches | `/getmatchdata/{league}/{season}` | 12h default; 15m for live discovery | Used to discover current candidates reliably, never as the active-score polling primitive. |
| Computed live discovery | filtered cross-competition candidate list | 1m | Avoids deserializing and sorting all five cached seasons on every server-rendered `/live` visit while keeping failure recovery short. |
| Home/competition snapshot | computed snapshot | 5m | Prevents repeated multi-competition fan-out. |
| Home API stale-while-revalidate | response cache | 5m | Allows stale navigation while a snapshot refreshes. |

Where the client accepts a caller override, it clamps a positive TTL to the endpoint's canonical
maximum. Fixed-policy endpoints always use the canonical value.

## Last-Changed Matchday Cache

OpenLigaDB exposes:

```txt
/getlastchangedate/{leagueShortcut}/{season}/{groupOrderId}
```

The core matchday loader stores:

```ts
{
  dataUpdatedAt,
  expiresAt,
  lastChanged,
  matches,
  revalidateAt
}
```

The refresh algorithm is:

1. For ordinary `when-cached` callers, reuse a local matchday entry until `revalidateAt`.
2. When a live-route check is due, request `getlastchangedate` as a blocking `no-store`
   validation.
3. If the timestamp is unchanged and the entry remains within its 12-hour maximum age, reuse
   the matches and advance `revalidateAt` by 30 seconds.
4. If the timestamp changed, the entry is missing/expired, or the last-change endpoint is
   unavailable, request the complete matchday through the same blocking validation policy and
   replace the cached payload. A `429` instead returns an existing entry as stale or fails cold.
5. If the full refresh fails and a usable payload exists, return it as stale.
6. If refresh fails cold, preserve the status and let the outer breaker control the next retry.

The local matchday cache is an LRU limited to 128 scopes. The narrow matchday route uses the
`always` check strategy. Its last-change and conditional matchday calls bypass the Next.js Data
Cache together so an expired payload cannot be stored under a newer marker. The 30-second CDN
response cache and per-instance in-flight map still coalesce viewer traffic before validation.

Advancing `revalidateAt` on an unchanged timestamp is important. Without it, every later
request would probe `getlastchangedate`, even though the previous check confirmed no change.

## Matchday Runtime Cache And Circuit Breaker

Each validated scope uses this logical key:

```txt
matchday:{league}:{season}:{group}
```

Runtime Cache hashes the physical key inside the versioned `football-data-v1` namespace.
Records have a 12-hour TTL and contain:

```ts
{
  checkedAt,
  failureCount,
  lastFailureStatus,
  lastGood,
  lastGoodAt,
  retryAt,
  version
}
```

The maximum accepted last-good age is also 12 hours. This retention is for resilience; the UI
does not claim that a 12-hour-old score is live.

On every permitted refresh:

1. Use the shared breaker only when `league` is supported and `season` and `group` are
   positive integers; the snapshot loader then validates the league/group against discovered
   data and resolves the requested season to an available season.
2. Share identical in-flight work within the function instance.
3. Read the matchday state and the origin-wide `429` cooldown in parallel.
4. If either breaker is open, return last-good data immediately or return a cached error when
   no last-good value exists.
5. If the last successful validation is less than 30 seconds old, return that shared Runtime
   Cache result without another upstream request.
6. Otherwise load the narrow matchday snapshot with a four-second abort deadline. Discovery
   metadata keeps its endpoint TTLs, while last-change and conditional matchday validation are
   blocking `no-store` requests.
7. On success, replace last-good data and reset the failure count.
8. On failure, calculate and store the next `retryAt` without overwriting the last success.

Runtime Cache read or write failures must never make score loading fail. The request proceeds
without the shared optimization and logs cache diagnostics only when
`OPENLIGADB_DIAGNOSTICS=1`.

## Backoff Policy

All circuit-breaker schedules use approximately +/-10% jitter. A valid upstream `Retry-After`
is a lower bound, so the application never retries earlier than requested.

| Scope | Failure | Schedule | Maximum |
| --- | --- | --- | ---: |
| Matchday key | timeout, network error, `5xx` | 15s -> 30s -> 60s -> 120s | 2m |
| OpenLigaDB origin | `429` | 60s -> 120s -> 300s | 5m |
| Home overview | timeout, incomplete snapshot, upstream error | 1m -> 2m -> 5m -> 15m | 15m |
| Home overview | `429` | 5m -> 10m -> 15m | 15m |

Ordinary matchday failures remain isolated. A failed Bundesliga matchday must not freeze a
Champions League matchday. A `429` is different: it creates the shared logical key
`matchday:openligadb-origin` so other matchdays do not continue hammering the same provider.
The per-matchday counter resets after a successful refresh. The origin `429` counter is not
explicitly cleared by an unrelated success; its expired `retryAt` becomes inactive and the
12-hour record eventually expires.

### Request-Level Retries

The circuit breaker is separate from the short retry sequence inside the OpenLigaDB client.

- One initial request plus at most two retries.
- Retry only `429` and `5xx` responses.
- Do not retry ordinary network errors, timeouts, or malformed JSON responses.
- Default delays are 300-499ms and 900-1099ms.
- Do not retry ordinary `4xx` responses such as `404`.
- Default per-request timeout is five seconds unless an outer route uses a shorter shared
  abort signal.
- A `Retry-After` of at most two seconds supplies the immediate retry delay. A larger value
  stops the retry sequence and creates a process-local endpoint cooldown instead of keeping a
  function asleep.
- Status and `retryAfterMs` are preserved on the final error for the shared breaker.

## Matchday CDN Policy

`/api/matchday` returns these response policies:

| Result | Response policy |
| --- | --- |
| Fresh `200` | `public, max-age=0, s-maxage=30, stale-while-revalidate=10` |
| Stale `200` | `s-maxage` equals the remaining breaker interval and includes `Retry-After` |
| Cold `429` or `5xx` | Shared for the remaining breaker interval to prevent a function storm |
| Validation `4xx` | `no-store` |

The stale response includes `refreshState: "stale"`, `refreshFailed: true`, `checkedAt`, and
`retryAt`. A healthy response includes `refreshState: "fresh"`.

## Live Polling Policy

The live client receives a lean list of matches instead of serializing full competition
tables and sections across the server/client boundary.

It refreshes:

- immediately after mounting;
- every 45 seconds while the tab is visible;
- when a hidden tab becomes visible again;
- when the user presses the refresh button.

It also refreshes the lightweight discovery list every five minutes while visible. Discovery
merging adds newly relevant matches and scopes but preserves any fresher matchday score already
held in browser state. A partial discovery response also retains the last-known candidates and
polling scopes for failed competitions, and retries discovery after one minute instead of five.

A matchday is eligible only when at least one loaded match:

- is unfinished;
- has a valid matchday scope;
- starts within the next 30 minutes or started no more than six hours ago.

Scopes are deduplicated by league, season, and group. Polling stops for finished matches,
matches older than six hours, undated matches, and matches without a trusted group. Overlapping
interval and manual requests are suppressed.

The browser validates that the response league, season, and group match the requested scope
before merging scores by competition and match ID. It also honors response `retryAt` and
`Retry-After` values and displays delayed data as delayed.

This policy replaces the old 45-second `router.refresh()` loop. The interval itself was not the
main compute problem; the full dynamic page render and per-viewer upstream fan-out behind it
were.

OpenLigaDB does not provide a dependable live flag or match minute, so the UI's ordinary
"possibly live" window remains three hours while the six-hour polling cutoff provides extra
settlement time for matches whose final state arrives late.

## Home Overview Policy

The overview is a cached base layer and is not used by `/live`.

- `unstable_cache` revalidates competition and overview snapshots every five minutes.
- Competition cache key version: `results-v6`.
- Overview cache key version: `results-v7`.
- Competition loads have a six-second abortable deadline.
- Overview orchestration has a 15-second outer deadline.
- Competition fan-out is limited to three concurrent loads.
- Runtime Cache retains the last successful overview for up to six hours.
- Shared overview record: `home-overview:results-v7`.
- A failed cold rebuild rejects through the success cache and creates structured fallback data
  only in the outer page-data boundary. Synthetic fallback is never cached as a successful
  overview.
- A failed warm rebuild serves the last successful overview and applies overview backoff.
- `/api/home` uses `s-maxage=300, stale-while-revalidate=300`; its error responses use
  `no-store`.

The overview can still load all configured competitions when its five-minute cache actually
revalidates. It is no longer rebuilt by every live browser every 45 seconds.

## Other Page Refreshes

`/`, `/today`, and other server-rendered pages may still reconcile a small number of uncertain
matches, but the path is bounded:

- maximum eight match IDs per request;
- maximum concurrency of four;
- two-second abort deadline per direct match load;
- 30-second Next.js cache instead of `cache: "no-store"`;
- live-estimate matches remain eligible;
- `unknown` matches remain eligible only through six hours after kickoff;
- missing, invalid, and older kickoff times are skipped.

This prevents an unfinished match that never receives a final state from being polled forever.

Competition pages that request a non-current matchday load that matchday directly with a
30-second revalidation and a six-second `Promise.race` deadline. That path does not use the
shared `/api/matchday` Runtime Cache breaker.

## Versioning And Invalidation

- Runtime Cache namespace: `football-data-v1`.
- Runtime record schema version: `2` (version `1` records are ignored because they may contain
  a stale payload paired with a newer change marker).
- Competition cache version: `results-v6`.
- Overview cache version: `results-v7`.
- Runtime tags: `openligadb`, `openligadb-matchdays`, and `openligadb-overview`.

Bump the namespace or record/cache version when a stored schema changes incompatibly. Runtime
Cache tags and Next.js data-cache tags are separate invalidation systems. No automatic
`expireTag` workflow is currently required because records use TTLs; if manual purging is added,
the implementation must explicitly invalidate every relevant cache layer.

## Failure Semantics

| Situation | Behavior |
| --- | --- |
| Healthy upstream | Return and cache fresh data; clear breaker failures. |
| Failed refresh with last-good data | Return stale `200`, publish retry time, and skip upstream until then. |
| Failed refresh without last-good data | Store breaker state and return a short shared `429`/`5xx`. |
| Invalid or unavailable league/group | Return validation `4xx` with `no-store`. |
| Runtime Cache unavailable | Continue through the normal loader; use local fallback where available. |
| Overview partially missing fixture-critical data | Reject it as a cacheable success and use stale/fallback data. |
| Table-only overview failure | Keep fixtures usable and surface partial-data UI. |

## Observability

Enable `OPENLIGADB_DIAGNOSTICS=1` temporarily when detailed cache diagnostics are needed.
Existing structured events include:

- `openligadb.request.recovered`;
- `openligadb.request.failed`;
- `snapshot_fallback`;
- `snapshot_stale`;
- matchday cache hit, miss, stale, and bypass status.

Observability is currently log-based and partial; there are no dedicated cache or breaker
metrics counters yet. Recovered retries, local matchday cache states, and Runtime Cache
read/write failures are diagnostic-only logs.

After deployment, monitor:

1. Vercel Fluid Active CPU and function invocations by route.
2. `/api/matchday` CDN hit/miss behavior and function duration.
3. Runtime Cache hit rate, operations, storage, and eviction behavior.
4. `429`, timeout, `5xx`, snapshot fallback, and stale-serving counts.
5. Full matchday fetches compared with `getlastchangedate` checks.
6. Score age reported by `checkedAt`/`dataUpdatedAt` during live windows.

Success criteria:

- no recurring `?_rsc` requests from the `/live` timer;
- no routine per-viewer `cache: "no-store"` score fan-out;
- one shared matchday refresh per active scope/cache location rather than per user;
- unchanged matchdays do not refetch the full payload;
- a provider outage produces stale responses and bounded retries, not a validation storm;
- materially lower Fluid Active CPU without unacceptable score delay.

## Test Coverage

The implementation has focused coverage for:

- transient retry and non-retryable status behavior;
- `Retry-After` propagation and shared `429` cooldown;
- last-change hit and changed-data refresh behavior;
- separation of cached metadata from blocking live validation;
- invalidation of version `1` Runtime Cache records;
- revalidation advancement when `lastChanged` is unchanged;
- last-good serving and open-breaker suppression;
- isolation between matchday breaker keys;
- Runtime Cache failure fallback;
- matchday route validation and CDN headers;
- active-scope deduplication and polling-window boundaries;
- current-season live discovery, effective shortcut resolution, and partial competition
  failures;
- exact exclusion of table, bracket, current-group, and broad round-scan work from live
  discovery;
- five-minute scope rediscovery that preserves fresher browser scores;
- cross-scope response rejection and exact score merging;
- bounded unknown-match reconciliation;
- abortable snapshot deadlines and overview stale fallback.

Relevant test files:

- `packages/core/tests/openligadb-client.test.ts`
- `packages/core/tests/get-matchday-snapshot.test.ts`
- `packages/core/tests/matchday-loader.test.ts`
- `src/app/api/matchday/route.test.ts`
- `src/features/football/server/matchday-refresh-cache.test.ts`
- `src/features/live/components/live-polling.test.ts`
- `src/features/live/server/get-live-page-data.test.ts`
- `src/app/api/live-scopes/route.test.ts`
- `packages/core/tests/live-schedule.test.ts`
- `src/features/football/server/refresh-uncertain-matches.test.ts`
- `src/features/home/server/home-snapshot-cache-policy.test.ts`

Required verification before release:

```txt
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Because the package test script's shell glob may not recurse consistently in every shell, CI
should also ensure every `src/**/*.test.ts` file is discovered.

## Rollout And Tuning

1. Deploy to preview and confirm fresh/stale headers on `/api/matchday`.
2. Confirm Runtime Cache records and hit rate appear in Vercel Observability.
3. Verify the browser network panel shows scoped `/api/matchday` calls, low-frequency
   `/api/live-scopes` calls, and no periodic RSC page refresh.
4. Promote to production and compare at least 24-48 hours of Fluid Active CPU and invocation
   data with the previous baseline.
5. Review score age during actual live fixtures, not only during quiet periods.
6. Tune the narrow live TTL/backoff before changing the five-minute overview policy.

If scores are too stale while OpenLigaDB is healthy, shorten only the live CDN/check interval.
If compute remains high, first inspect cache misses, regional duplication, and unexpected routes
before lengthening live backoff.

Future improvements, only if metrics justify them:

- pin the narrow refresh route to one region or use a durable global store if cross-region
  duplicate refreshes become meaningful;
- add explicit cache-hit and breaker-state counters;
- add on-demand invalidation if OpenLigaDB ever provides a dependable change webhook;
- replace `unstable_cache` with a Next.js Cache Components strategy in a separate migration.

## Expected Result

Under normal traffic, `/live` discovers candidates through cached current-season schedules and
refreshes only active matchday scopes. Browsers make lightweight scoped requests, the CDN shares
those responses, and OpenLigaDB receives a small timestamp check before any full active matchday
payload is downloaded. An unpublished competition produces an empty schedule instead of a round
scan. During failures, healthy competitions remain usable and repeated upstream work is
suppressed. The expensive home overview is completely decoupled from the live route.
