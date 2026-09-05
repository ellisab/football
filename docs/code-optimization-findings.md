# Code optimization findings

Reviewed and implemented on 2026-09-05, following the code cleanup in `cdcc34e`. **All five findings are implemented.**

This pass reduces repeated computation, removes the overview's sequential loading dependency, and shares concurrency code. Match ordering and identity rules, search scores and tie breaking, competition/season selection, partial failures, timeouts, and rate-limit handling are covered by regression checks.

| ID | Finding | Resolution | Status |
| --- | --- | --- | --- |
| OPT-01 | Match sorting builds full presentations and repeatedly parses kickoff dates inside its comparator. Single-match lookup sorts unrelated matches. | [view-utils.ts](../src/features/football/view-utils.ts) uses the existing status-only helper and calculates sort keys once with a shared current time. Lookup deduplicates first, then sorts only candidates with the requested ID. | Complete |
| OPT-02 | Search normalizes the same query for every item and unchanged candidate text on each keystroke. | [search-ranking.ts](../src/features/search/search-ranking.ts) prepares normalized candidates and tokens. [SearchExperience](../src/features/search/search-experience.tsx) rebuilds the index only when `items` changes, normalizes each query once, and filters kinds before scoring. | Complete |
| OPT-03 | Team collection scans accumulated matches for duplicates, calculates status for both teams separately, and search collects the same matches twice. | [view-utils.ts](../src/features/football/view-utils.ts) uses per-team identity sets, shares match metadata across both teams, and reuses kickoff values for sorting. [search-page.tsx](../src/features/search/search-page.tsx) passes its existing match collection into team collection. | Complete |
| OPT-04 | Overview loading waits for a complete seed competition before starting the other competitions. | [get-home-league-metadata.ts](../packages/core/src/home/get-home-league-metadata.ts) supplies shared request metadata. [get-home-page-data.ts](../src/features/home/server/get-home-page-data.ts) starts other competitions before the seed finishes and reuses pending loads. | Complete |
| OPT-05 | Live discovery and live matchday refresh maintain separate bounded worker queues. | The existing helper now lives in [core/async](../packages/core/src/async/map-settled-with-concurrency.ts), exported through `@footballleagues/core/async`. Home round/bracket loading, live schedule discovery, and server matchday refresh share it. | Complete |

## Measured repeated work

A synthetic fixture contains 500 matches ordered by `id = (index * 293) % 500 + 1`, hourly kickoffs starting in January 2030, and every third match marked finished. Both teams appear in each match. A separate 500-item search fixture contains a label and description for each item and uses the query `DORTMUD`.

| Operation | Before | After |
| --- | ---: | ---: |
| Match collection/sort: `Date.parse` calls | 19,658 | 834 |
| Lookup of one unique match ID: `Date.parse` calls | 19,658 | 0 |
| Team collection, including match collection: `Date.parse` calls | 24,652 | 1,668 |
| Search query normalizations | 501 | 1 |
| Total normalizations per search after preparing the index | 1,501 | 1 |

Preparing the search index performs its candidate normalization once per item-list change. The original direct scoring/ranking entry points remain available; repeated interactive searches use the prepared index.

A two-competition overview fixture with an injected 20 ms metadata delay and 30 ms endpoint delays took a median **355.2 ms before** and **178.2 ms after** across three runs each, with identical output. Metadata loads fell from two to one. These are synthetic measurements of repeated work and loading order; production latency has not been profiled.

## Behavior retained

- Collection keeps its existing identity rules and first occurrence. Lookup deduplicates before filtering IDs, including ambiguous fallback identities. Date-filtered collection continues to filter before deduplication.
- Team names and table positions retain their original precedence. Equal kickoff times preserve the existing next-match selection, including duplicates across competitions. Unknown dates keep their previous ordering.
- Search preserves weighted scores, fuzzy matching, German label ordering, stable ties, kind filters, and result limits. Its index is local to the component and changes with its item list.
- Overview metadata is shared within a request. The existing seed-based league/season and fallback selection remains intact. If the initial metadata request fails, other competition loads retain their opportunity to recover independently.
- Live loading retains its limit of three concurrent requests, per-request timeouts, and partial failures. Home loading retains stop-on-rate-limit behavior, allowing already-started work to finish.

## Validation

- **164 tests passed**, with no failures, skips, or cancellations, using `node --import tsx --test 'src/**/*.test.ts' 'packages/core/tests/**/*.test.ts'`.
- Added 15 regression tests covering ordering, identity collisions, team metadata/deduplication, search indexing/ranking, concurrent overview starts, season selection, metadata recovery, and bounded-worker failure behavior.
- Comparison against the previous implementation passed for **100 generated match/team fixtures**, **400 lookups**, and **48 search cases**. The overview timing fixture also produced identical output.
- Next.js route generation and TypeScript passed, including `noUnusedLocals`, `noUnusedParameters`, and unreachable-code checks.
- Biome passed with the existing **15 warnings and one schema-version notice**; no new lint warnings were introduced.
- React review checked index memoization, hook dependencies, immutable item handling, server/client boundaries, and preservation of accessible search output.
- `git diff --check` passed.
- **Production build passed** with `./node_modules/.bin/next build --webpack`, including compilation, all 18 static pages, and build tracing. The rerun with approved network access completed without the upstream network errors seen in the sandboxed attempt. The webpack flag was used for verification; project build configuration and dependency versions are unchanged.

No implementation items remain open in this report. Checks used the installed local toolchain.
