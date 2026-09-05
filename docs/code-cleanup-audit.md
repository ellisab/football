# Code cleanup audit

Completed on 2026-09-05. **All reported cleanup findings are resolved:** seven duplication groups, one unreferenced helper, six test-only helpers, three unused fields/computations, seventeen unused CSS classes, and two dead or redundant logic patterns. The previously reported Next.js route export error is also fixed.

The temporary `AUDIT[...]` source comments have been removed. This report retains their IDs and records the resulting implementation.

| Audit ID | Resolution |
| --- | --- |
| `UNUSED-01` | Removed the unreferenced `getRetryAfterMs` from [shared.ts](../packages/core/src/home/domain/shared.ts). |
| `UNUSED-02` | Removed `getMatchById`, `getMatchesByTeamId`, and `getAvailableTeams` from [client.ts](../packages/core/src/openligadb/client.ts); removed `formatKickoff`, `getStageLabel`, `sortMatchesByUpcomingFirst`, and their unused formatter from [match-utils.ts](../packages/core/src/matches/match-utils.ts). Removed the orphaned teams cache setting and API type import. |
| `UNUSED-03` | Removed `accentClass` and its five unused gradient values from [competition-meta.ts](../src/features/football/competition-meta.ts). |
| `UNUSED-04` | Removed `TeamSummary.recentMatch` and the computation that maintained it. Team views continue to use the sorted `recentMatches` array in [view-utils.ts](../src/features/football/view-utils.ts). |
| `UNUSED-05` | Removed the unused `TeamSummary.tablePosition.competitionLabel` field and assignment in [view-utils.ts](../src/features/football/view-utils.ts). |
| `DEAD-01` | Removed the always-false `shouldStopValue` callbacks, their now-unused support in the concurrency helper, and the bracket loader's no-op rate-limit assignment/fields. Rejected HTTP 429 requests still stop work through `shouldStop` in [shared.ts](../packages/core/src/home/domain/shared.ts), [load-bracket.ts](../packages/core/src/home/domain/load-bracket.ts), and [resolve-rounds.ts](../packages/core/src/home/domain/resolve-rounds.ts). |
| `DEAD-02` | Simplified the duplicate `teamName` branches to `team?.teamName` in [view-utils.ts](../src/features/football/view-utils.ts), preserving the distinction between match-team and table-team numeric IDs. |
| `DUPLICATE-01` | Both round loaders use [dedupe-matches.ts](../packages/core/src/matches/dedupe-matches.ts), retaining the first occurrence and the existing fallback identity rules. |
| `DUPLICATE-02` | Match lists and knockout ties use the comparator in [match-order.ts](../packages/core/src/matches/match-order.ts), preserving kickoff ordering, match-ID tie breaking, and unknown dates last. |
| `DUPLICATE-03` | Team and competition directories use [normalize-directory-text.ts](../src/features/football/normalize-directory-text.ts). Universal search keeps its distinct normalization behavior. |
| `DUPLICATE-04` | Competition tabs and matchday navigation use [competition-href.ts](../src/features/competitions/competition-href.ts). |
| `DUPLICATE-05` | The live controller imports the single `getScopeKey` implementation from [live-polling.ts](../src/features/live/components/live-polling.ts). |
| `DUPLICATE-06` | Date-filtered and all-competition match lists use one collector in [view-utils.ts](../src/features/football/view-utils.ts). Date filtering still occurs before deduplication and sorting. |
| `DUPLICATE-07` | Live and standings controllers share [use-visible-refresh.ts](../src/features/football/refresh/use-visible-refresh.ts), [visible-refresh.ts](../src/features/football/refresh/visible-refresh.ts), and [refresh-status.tsx](../src/features/football/refresh/refresh-status.tsx). Initial refresh, the 45-second visible-tab schedule, cleanup/abort behavior, status announcements, and button state are preserved. Live discovery, backoff, and payload merging remain in the live controller. |
| `UNUSED-CSS` | Removed 28 obsolete rules and only the obsolete selectors from eight shared rules in [globals.css](../src/app/globals.css). All 17 classes listed below are gone. |
| Route export error | Moved `buildLiveScopesResponse` and its cache headers to [response.ts](../src/app/api/live-scopes/response.ts). The [route module](../src/app/api/live-scopes/route.ts) now exports only `GET`, as required by Next.js; response tests import the helper directly. |

Removed CSS classes:

- `match-summary`, `match-summary-compact`, `match-time-column`, `match-time`, `match-date`, `match-score-number`, `match-kickoff`, `match-competition-line`, `match-team-line`, `match-team-name`
- `today-competition-group`, `today-competition-heading`
- `favorite-match-list`, `featured-match-list`, `surface-panel`, `section-label`, `control`

The dynamic `match-detail-kickoff--upcoming` selector is preserved. A comparison of the parsed stylesheets confirmed that **all 437 active selector occurrences retain their declaration values, order, and media/layer context**.

The six test-only helpers were removed from the private core package together with four tests that exclusively exercised removed functionality. Shared localization and discovery-cache assertions were retained and adjusted to use the surviving APIs. Seven regression tests were added for ordering, deduplication, Berlin date boundaries, team identity, visible-tab scheduling/cleanup, and refresh status announcements.

Validation:

- **153 tests passed**, with no failures, skips, or cancellations, using `node --import tsx --test 'src/**/*.test.ts' 'packages/core/tests/**/*.test.ts'`.
- **Route generation and TypeScript passed**, including `noUnusedLocals`, `noUnusedParameters`, and unreachable-code checks.
- **Production build passed** with `./node_modules/.bin/next build --webpack`, including static page generation and build tracing. The default Turbopack build could not finish because this environment prohibits its internal worker from binding a port. The webpack flag was used only for verification; project build configuration is unchanged.
- **Biome passed**, with the same 15 existing warnings and one schema-version notice as before cleanup.
- **Static audit rescan passed:** no remaining exact duplicate function bodies at the audit's 20-token threshold and no unreferenced non-framework exports beyond the intentionally tested editorial override diagnostic. All reported obsolete CSS classes are absent.
- React review checked stable effect callbacks/dependencies, initial refresh and cleanup behavior, module boundaries, and accessible status/button output.
- `git diff --check` passed.

Checks use the installed local tools because the `pnpm` launcher cannot fetch/verify the pinned package-manager version in this environment. The production build required approved network access to fetch the project's existing Google Fonts. Dependency versions and configuration were not changed.
