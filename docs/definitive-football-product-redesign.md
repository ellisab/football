# Spieltag: Definitive Football Product Redesign

Status: canonical product and visual specification for the current 2026 implementation.

This document is the product, UX, visual, accessibility, data, and engineering source of truth for the redesign. It incorporates the later sculpted-light theme and is grounded in the current Next.js repository and the fields OpenLigaDB actually exposes. The pre-redesign audit and dated validation record are retained as historical context. Runtime caching and polling are documented separately in [the OpenLigaDB caching plan](./openligadb-caching-plan.md).

## 1. Pre-redesign UX audit

The findings in this section describe the product before the July 2026 rebuild. They explain the decisions that follow; they are not a description of the current interface.

### The five most important problems

1. **Scores are visually secondary.** The current near-full-viewport hero pushes the first useful match list more than two mobile screens below the top. A scores product cannot make users pass a campaign page before answering “what is happening today?”.
2. **Core destinations do not exist.** There is no real Live, Competitions, Search, Favorites, or date-navigation experience. The search icon links to Teams, selected navigation is not exposed, and the 320px header is a clipped horizontal rail.
3. **Competition context is shallow.** Competition pages reuse the overview composition and expose only a season query. There is no previous/next matchday, direct matchday selection, current-matchday action, or clear matches/standings switch.
4. **Some UI claims exceed the data.** Standings infer “Quali” and “Gefahr” from row position for every league, aggregate season W/D/L is presented as form, and match detail shows placeholder possession/shots/corners that OpenLigaDB does not provide.
5. **The universal overview is too expensive and too long.** The homepage fans out to every competition and renders complete fixture/table sections into one document. The audited mobile document exceeded 22,000px, 4,000 DOM nodes, 180 links, and 200 images, while a priority-loaded 2.7MB hero image delayed the score-first experience.

### Navigation and mobile problems

- `/` and `/today` are effectively the same page.
- Date is neither selectable nor represented in the URL.
- Primary navigation omits DFB-Pokal and Champions League while exposing individual competitions instead of a stable product-level hierarchy.
- Mobile navigation relies on hidden-scrollbar horizontal overflow and has no persistent thumb-reachable destinations.
- Search is visually implied but not implemented.
- There is no favorite state, selected navigation state, or clear route context.

### Accessibility problems

- Team crest alt text duplicates the adjacent visible team name.
- Refreshed scores have no focused polite live announcement.
- Navigation has no `aria-current` state.
- Mobile standings stop being a semantic table.
- Focus treatment is inconsistent and some icon-only controls are ambiguous.
- There is no application-level error, loading, or custom 404 experience.
- The existing `:root` and `.dark` palettes are both dark; no light theme exists.

### Performance concerns

- The all-competition loader is reused by Today, Tables, Teams, team detail, and match detail.
- Match detail can fetch a match successfully and still 404 because the match is absent from the current overview slice.
- Team detail is derived from the same partial current snapshot.
- Two independent 45-second polling systems can duplicate traffic.
- Repeated blur, continuous decorative animation, three font families, and a full-screen image are disproportionate to a score task.
- The current timeout fallback does not abort underlying work.

Current limitation after the rebuild: Today, Tables, Teams, team detail, and match detail still
derive from the shared overview snapshot. Match/team IDs outside that loaded slice can still
return `404`. The two old polling systems were replaced by one scoped live refresh controller.

### Retain

- Next.js App Router and Server Components by default.
- OpenLigaDB typed transport types, data-source abstraction, retry/backoff, caching, and last-change matchday cache.
- League discovery, season resolution, matchday loading, and tie grouping.
- `TeamBadge` host validation, Next Image sizing, and missing-image fallback.
- Berlin date utilities, match IDs, competition slugs, and the narrow matchday API.
- Semantic desktop table foundation and reduced-motion support.

### Rebuild decisions

- `HomeView`, full-screen `HomeHero`, duplicated headers, context rail, and ticker were removed.
- The three competing match-card anatomies were replaced by `SculptedMatch`.
- Unsupported standings zones/form and fictional match statistics were removed.
- Team and match pages became contextual, snapshot-backed journeys.
- Global states, navigation, the light theme, search, favorites, and route-specific views were
  added over the shared data layer.

## 2. Product strategy

### Primary users

- The quick checker: wants today’s score or next kickoff in seconds.
- The competition follower: moves between matchdays, fixtures, results, and standings.
- The team follower: wants the next match, previous result, and table context.
- The live follower: revisits during matches and needs calm, trustworthy updates.
- The returning fan: wants favorite teams and competitions prioritized without an account.

### Primary intents

1. See today’s matches.
2. See what is live or recently finished.
3. Open a match and understand its verified events.
4. Switch competition, season, and matchday without losing orientation.
5. Find a team or competition directly.
6. Return to favorite content faster on the next visit.

### Content priority

1. Date and current context.
2. Live status, score, teams, and kickoff.
3. Competition and matchday.
4. Favorite relevance.
5. Standings and verified event detail.
6. Venue and secondary metadata.

### Personalization strategy

Favorites are optional, versioned local data. They never replace URL state or require an account. Favorite competitions and teams add a small priority section to Today and populate `/favorites`; the complete chronological Today list remains intact.

## 3. Information architecture and navigation

### Route model

- `/` — canonical score-first Today experience.
- `/today?date=YYYY-MM-DD` — selected Berlin date.
- `/live` — live-estimate matches, with honest empty/upcoming fallback.
- `/competitions` — searchable competition directory.
- `/competitions/[slug]?season=YYYY&matchday=N&view=matches|standings` — competition command center.
- `/tables?competition=slug&season=YYYY` — compatibility overview for tables.
- `/teams` and `/teams/[teamId]` — team browse and snapshot-backed team detail.
- `/matches/[matchId]` — match detail for IDs present in the supported competition snapshot.
- `/search?q=...` — universal, shareable search.
- `/favorites` — locally prioritized teams and competitions.

Legacy `/?league=&season=` and the existing API routes remain compatible during migration.

### Desktop navigation

- Product identity.
- Today.
- Live.
- Competitions.
- Tables.
- Teams.
- Favorites.
- Search.

The global header remains compact and sticky. Route-specific context bars live inside pages because season, matchday, and date belong to the URL and cannot be reliably inferred by the root layout.

### Mobile navigation

- Compact top bar: identity and search.
- Bottom navigation: Today, Live, Competitions, Favorites.
- Teams remain one tap away through search and competition pages.
- The page reserves bottom safe-area space and never depends on a hidden horizontal rail.
- All primary targets are at least 44×44px.

### Core journeys

1. Today → previous/next date → match → browser back to the same date.
2. Live → match → team → competition/matchday.
3. Competitions → season → matchday → standings.
4. Team → next match/recent result → match detail.
5. Search → team, competition, match, or matchday.
6. Favorite control → immediate feedback → prioritized Today/Favorites content.

## 4. Historical visual-direction exploration

These were the alternatives evaluated during the rebuild. Matchday Signal supplied the product
structure; the subsequent sculpted-light pass supplied the current visual expression.

### Direction A: Matchday Signal — recommended

- **Concept:** stadium wayfinding plus a precise live instrument.
- **Character:** immediate, calm, confident, modern.
- **Typography:** Space Grotesk for product/editorial hierarchy; JetBrains Mono for time, scores, and standings.
- **Color:** warm paper-like light theme; one signal red/coral estimated-live token, one blue action token, restrained competition accents.
- **Layout:** compact sticky shell, date rail, grouped fixture ledger, strong whitespace, shallow surfaces.
- **Match treatment:** one reusable horizontal anatomy with comfortable and compact densities; score and team names dominate.
- **Navigation:** persistent product destinations plus route-owned context controls.
- **Strengths:** fastest scanning, excellent mobile fit, accessible status semantics, low visual debt.
- **Risks:** requires restraint; poor spacing would make it feel merely utilitarian.

### Direction B: Fixture Ledger

- **Concept:** premium match programme and editorial results paper.
- **Character:** cultured, warm, archival, football-literate.
- **Typography:** editorial serif display paired with a neutral sans and tabular mono data.
- **Color:** warm off-white, ink, burgundy live accents, desaturated club colors.
- **Layout:** date-led columns, ruled sections, generous headlines, denser lists below.
- **Match treatment:** ticket-like rows with precise rules and typographic score blocks.
- **Navigation:** chapter-like competition index and strong breadcrumbs.
- **Strengths:** distinctive brand and beautiful historical browsing.
- **Risks:** additional font cost; live information can feel less immediate.

### Direction C: Broadcast Pulse

- **Concept:** a restrained broadcast control surface.
- **Character:** energetic, technical, data-forward.
- **Typography:** condensed display labels with mono score numerals and neutral sans body.
- **Color:** dark-first neutral panels, restrained cyan actions, amber upcoming, coral live.
- **Layout:** split rails, sticky status strip, dense desktop rows, modular live panes.
- **Match treatment:** scoreboard modules with event ticks and context rails.
- **Navigation:** command-center tabs and a keyboard palette.
- **Strengths:** strong live identity and high desktop density.
- **Risks:** easiest direction to overanimate, over-darken, or resemble a generic dashboard.

## 5. Current direction: Matchday Signal with Sculpted Light

**Matchday Signal** remains the structural foundation because it best serves the product
principle “every score and every competition is one step away.” Today, Live, competition,
search, team, and favorites routes retain its shallow information architecture, honest status
language, and server-first behavior.

The current visual layer is **Sculpted Light**:

- warm-white canvas, white and pale-gray surfaces, charcoal text, and hairline borders;
- subtle shadows and dimensional controls used to create hierarchy rather than decoration;
- Space Grotesk for product text and JetBrains Mono for time and compact data;
- a predominantly monochrome palette, with red reserved for estimated-live emphasis; team and
  competition identity comes mainly from names and crests rather than colored UI surfaces;
- a sculpted scoreboard with a central circular status signal as the signature match component;
- responsive boards that preserve team, score, status, and kickoff information on small screens;
- compact navigation, tables, directories, and supporting controls around the more expressive
  match treatment.

The application intentionally ships a light-only theme. It declares `colorScheme: "light"` and
does not expose a theme toggle or dark token set. The emotional identity comes from typography,
spacing, score scale, team crests, and physical-looking surfaces—not a full-screen stadium image
or fictional statistics.

The original theme recommendation proposed limiting the sculpted scoreboard to featured
matches. The current implementation instead uses it for every `MatchCardList` item and for the
match-detail hero. This is the implemented behavior, while list density remains a tuning
opportunity rather than an undocumented assumption.

## 6. Design system

### Tokens

- Spacing: 4, 8, 12, 16, 20, 24, 32, 48, 64px.
- Content widths: 48rem reading column, 70rem match-feed/detail column, 73.75rem wide
  content, and 77.5rem outer shell.
- Radius: 1.1rem base radius, pill controls, and larger 2.15rem desktop/1.5rem mobile
  sculpted scoreboards.
- Type: fluid display sizes with compact metadata; scores use large Space Grotesk while
  time/status data uses JetBrains Mono and tabular numerals where applicable.
- Motion: mostly 140-180ms interaction transitions, skeleton shimmer while loading, a static
  live marker, and reduced-motion overrides.
- Shadow: shallow elevation for ordinary surfaces and deeper dimensional shadow only for the
  sculpted scoreboard.
- Breakpoints: 40rem, 48rem, 56rem, and 64rem behavior changes, plus a 22rem narrow-phone guard.

### Semantic colors

- `canvas`, `surface`, `surface-raised`, `surface-subtle`.
- `text`, `text-muted`, `text-soft`, `border`, `border-strong`.
- `action`, `action-contrast`, `focus`.
- `live`, `live-surface`, `finished`, `upcoming`, `unknown`.
- Team and competition identity comes from text and crests; status never depends on color alone.

The active palette is warm light: `#f7f6f2` canvas, white raised surfaces, `#252623`
primary text, `#c82b3a` estimated-live emphasis, and `#315f73` focus. Semantic roles remain
preferable to hard-coded component colors even though no dark variant currently ships.

### Interaction rules

- Every interactive element has default, hover, focus-visible, active, and disabled states.
- Status always combines text with shape/icon where useful.
- Whole match rows are clickable only when a real match ID exists.
- Missing IDs render a non-interactive `<article>`, never `href="#"`.
- Focus rings use a 3px high-contrast outline with offset.
- Reduced motion disables transforms and score transitions.

### Density

- Expressive: the current sculpted match board used across match lists and match detail.
- Compact: navigation, metadata, directories, tables, filters, and supporting controls.
- Detail: match page with periods, goals, venue, and adjacent context.

## 7. Page-by-page specification

### Today

- **Purpose:** answer what is happening on the selected date within one second.
- **Hierarchy:** date navigator → score summary → favorite spotlight → data scope notice →
  estimated live → upcoming → status unknown → finished → competition links.
- **Primary action:** open a match.
- **Secondary:** change date, open competition, favorite content.
- **Mobile:** single column with compacted sculpted scoreboards and full date controls.
- **Desktop:** centered, wide sculpted scoreboards with supporting content kept compact.
- **Edges:** no matches, incomplete date index, partial competition failure.

### Live

- **Purpose:** focus on unfinished recent-kickoff matches without overstating API certainty.
- **Hierarchy:** last checked → live-estimate matches → next upcoming matches when empty.
- **Primary action:** open match.
- **Edges:** no live matches, offline, stale update, source cannot confirm status.

### Competitions

- **Purpose:** expose every supported competition without a deep hierarchy.
- **Hierarchy:** server-filtered complete catalog with a favorite control on each card; seasons
  are selected after opening a competition.
- **Primary action:** open competition.
- **Edges:** temporarily unavailable season metadata.

### Competition overview and matchday

- **Purpose:** complete competition command center.
- **Hierarchy:** competition/season/status → matchday controls → matches/standings view.
- **Primary action:** inspect selected matchday.
- **Secondary:** previous/next/current matchday, season, standings, favorite.
- **Mobile:** scroll-free primary controls, native select for direct jump, and responsive
  sculpted match boards.
- **Desktop:** previous/select/next controls and matches/table in a focused content grid.
- **Edges:** invalid season/matchday, season not started, empty round, no table.

### Standings

- **Purpose:** show the reliable table only.
- **Priority:** position, team, played, goal difference, points.
- **Mobile:** horizontally safe semantic table with lower-priority W/D/L progressively hidden.
- **Edges:** group tables, no table, partial cells. Never infer qualification or relegation rules.

### Team page

- **Purpose:** answer next match, previous result, competitions, and table position.
- **Primary action:** open next match.
- **Secondary:** open recent result or competition.
- **Edges:** team known but no nearby matches, missing crest, partial snapshot, or team absent
  from the currently loaded supported-competition slice.

### Match detail

- **Purpose:** present the verified match story with excellent hierarchy.
- **Hierarchy:** status/competition → teams/score → date/venue/matchday → period results → goals → adjacent context.
- **Edges:** missing score/time/venue, unknown status, no goals, or a `404` when the match ID is
  absent from the currently loaded supported-competition slice.
- Never show possession, shots, corners, lineups, or xG without a source.

### Search

- **Purpose:** universal direct access.
- **Hierarchy:** query → grouped results for competitions, teams, matches, matchdays.
- **Behavior:** GET URL, forgiving NFKD normalization, exact/prefix/token/substring ranking.
- **Accessibility:** labelled search input, result count live region, visible submit/clear, dedicated page remains available without JavaScript.

### Favorites

- **Purpose:** one local home for favorite teams and competitions.
- **Hierarchy:** favorite competitions → teams → relevant matches.
- **Edges:** first-use explanation, removed/unavailable item, storage unavailable.

### Loading

- Stable shell, date/header skeleton, repeated match-row skeletons, no full-screen spinner.

### Empty

- Specific reason, calm language, and a useful action: return to Today, change date/matchday, or browse competitions.

### Error

- Preserve the shell and context; explain partial versus total failure; offer retry and safe destinations.

### 404

- German product language, search action, Today action, and competition browse action.

## 8. Responsive behavior

- 320px: no horizontal page overflow; four-item bottom navigation; score remains visible; long
  team names clamp to two lines.
- 375/430px: responsive sculpted boards and full date controls.
- Tablet portrait: one main column with contextual cards.
- Tablet landscape: the primary content remains a focused main column.
- Laptop: persistent global header and match boards bounded to their feed width.
- Wide desktop: whitespace expands while match boards remain bounded to 65rem.
- Essential score, status, teams, and kickoff are never removed merely to fit.

## 9. Accessibility specification

- Target WCAG 2.2 AA.
- Skip link to `#main-content`.
- One page `<h1>`, logical section headings, semantic header/main/footer/nav.
- `aria-current="page"` for global navigation and selected route tabs.
- Decorative crests use empty alt when the adjacent name is visible.
- Match rows expose a concise label such as “Bayern München 2, Borussia Dortmund 1, beendet.”
- One polite live region announces meaningful score/status updates; the list itself is not live.
- Native links and selects are preferred; dialogs trap focus only when a real dialog is used.
- Keyboard order follows visual order; Escape closes overlays.
- Status is never color-only.
- Minimum 44px touch targets.
- The light theme must meet AA text and focus contrast.
- Reduced-motion preference removes nonessential transitions/transforms.

## 10. OpenLigaDB mapping strategy

### Transport fields available

- Competition/season: league ID, name, shortcut, season, sport.
- Stage: group ID, name, order.
- Team: ID, name, short name, crest, group name.
- Match: ID, UTC/local kickoff, league metadata, stage, teams, last update, finished flag, results, goals, venue.
- Result: points, type, order, description.
- Goal: score, scorer, goal minute, penalty/own-goal/overtime flags.
- Standing: played, W/D/L, goals, goal difference, points.

### Source limitations

- No authoritative live flag or current match clock.
- No postponed/cancelled state.
- Goal minute is event time, not current minute.
- No cards, substitutions, lineups, possession, shots, corners, xG, or qualification rules.
- No reliable competition country/crest or season lifecycle.
- Community competition shortcuts can be duplicated or inconsistent.

### Normalized presentation model

- `Competition`, `Season`, `Stage`, `Team`, `Match`, `MatchResult`, `Standing`, `DataState`.
- Stable source ID with a scoped composite fallback.
- Nullable kickoff, score, crest, venue, and result values.
- Status provenance: `scheduled`, `live-estimate`, `finished`, `status-unknown`; postponed/cancelled only when explicitly sourced.
- Preserve partial/final/penalty result phases.
- Deduplicate before presentation.
- Never coerce a missing score to zero.

### Status rules

- `matchIsFinished === true`: finished.
- Future kickoff and unfinished: scheduled.
- Recent kickoff and unfinished: live estimate, labelled as such without a minute.
- Substantially overdue and unfinished: status unknown.
- Missing kickoff: status unknown.

### Date strategy

OpenLigaDB has no all-competitions-by-date endpoint. Complete arbitrary-date support requires cached whole-season fixture indexes per supported competition, indexed by Berlin date and refreshed narrowly by matchday. Until that index is complete, the UI must label its available scope and never imply a complete date result when data is partial.

## 11. Component architecture

```text
AppShell (server)
├── AppHeader
│   ├── Brand
│   ├── PrimaryNavigation (small client active-state island)
│   └── SearchControl (small client keyboard-navigation island)
├── Page content (server-first)
├── MobileNavigation (small client active-state island)
└── SiteFooter

Football presentation
├── DateNavigator
├── MatchdayNavigator
├── FavoriteButton (client)
├── MatchList
│   └── MatchCardList
│       └── MatchCard
│           └── SculptedMatch
│               └── TeamBadge
├── StandingsCard / TablesView
├── TeamsView / TeamDetailView
├── MatchDetailView
└── Product UI states

Feature islands
├── FavoriteSpotlight
├── FavoritesView
├── SearchExperience
└── LiveRefreshController
```

Server Components remain the default. Client code is limited to `PrimaryNavigation`,
`MobileNavigation`, `SearchControl`, favorites state and pagination, progressive
`SearchExperience` filtering, and `LiveRefreshController` updates.

## 12. Implementation record

1. Added normalized status, query, search, and favorites utilities with tests.
2. Introduced semantic light tokens, the sculpted visual layer, a compact global shell, skip
   link, and responsive mobile navigation.
3. Built one reusable `SculptedMatch` anatomy and a truthful semantic standings table.
4. Rebuilt `/` and `/today?date=` and added `/live`.
5. Added `/competitions` and a URL-driven competition command center.
6. Removed unsupported match statistics and implemented snapshot-backed match/team detail.
7. Added `/search` and versioned local `/favorites` behavior.
8. Added application-level loading, error, empty, and 404 states.
9. Removed obsolete hero, duplicate navigation, duplicate cards, and legacy presentation trees.
10. Established route, breakpoint, keyboard, data-state, and build verification baselines.

## 13. Before and after

### Before

- Campaign hero before scores.
- One giant overview document.
- Horizontal mobile navigation rails.
- No date, Live, Search, Favorites, or competition directory.
- Competition page is a themed overview reuse.
- Unsupported table zones and placeholder match statistics.
- Dark-only hard-coded visual language.

### Implemented after

- Scores and selected date appear immediately.
- Focused route-specific presentation and a lean live-client payload.
- Stable desktop header and thumb-reachable mobile navigation.
- Shareable date, search, season, matchday, and view state.
- Honest OpenLigaDB status and missing-data semantics.
- One reusable sculpted match anatomy and semantic standings table.
- Intentional sculpted-light theme and complete route states.

### Production implementation map

- Global shell and sculpted-light theme: `src/features/shell/**`, `src/app/layout.tsx`, and
  semantic tokens plus dimensional surfaces in `src/app/globals.css`.
- Score-first Today and date state: `src/features/today/**`, `/`, and `/today?date=YYYY-MM-DD`.
- Honest live experience and one visibility-aware refresh controller: `src/features/live/**`
  and `/live`, polling scoped `/api/matchday` data every 45 seconds while visible.
- Competition directory and command center: `src/features/competitions/**`, `/competitions`, and URL-driven season, matchday, scope, and view controls.
- Match presentation and normalized status guardrails: `packages/core/src/matches/**`,
  `src/features/football/components/sculpted-match.tsx`, and
  `src/features/football/components/match-card-list.tsx`.
- Local favorites and forgiving search: `src/features/favorites/**`, `src/features/search/**`, `/favorites`, and `/search?q=`.
- Team and match journeys: supported-snapshot team and match details, verified goal/period detail, and adjacent match context.
- Global route states: `src/app/loading.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx`.
- Retired implementation: the full-screen hero, duplicate route frame, duplicate match card, horizontal context rail, old polling layer, and legacy tournament presentation tree were removed.

## 14. Validation baseline

- Install with frozen lockfile.
- Unit tests for status, date/query parsing, search ranking, favorite serialization, and partial data.
- Existing core/API tests.
- Biome, strict TypeScript, Knip, and production build.
- Route discovery and direct URL reloads.
- Search, favorites persistence, competition/season/matchday/date switching.
- Keyboard-only traversal and focus visibility.
- Screen-reader-oriented snapshots for match labels, landmarks, tables, and live region.
- 320, 375, 430, tablet portrait/landscape, laptop, and wide desktop.
- Light theme, reduced motion, and no horizontal overflow.
- Loading, no matches, no live matches, invalid route, partial API failure, and total API failure.
- Browser console/network audit and focused polling audit.
- Core Web Vitals risk review: image priority, JS boundaries, font count, layout stability, and request fan-out.

### Latest recorded verification

The latest repository-wide verification was recorded on 2026-07-22:

- 60 application tests and 81 core-package tests passed when all test files were discovered;
- strict TypeScript, repository linting, and the production build passed;
- `/` and `/live` browser smoke checks completed without application console errors;
- the live browser used the scoped matchday refresh path instead of periodic full-page RSC
  refreshes.

The 60 application tests required explicit recursive discovery because the package test
script's shell glob does not recurse consistently in every shell. CI should verify discovery
rather than assuming `pnpm run test` alone selected every `src/**/*.test.ts` file.

The July 2026 rebuild also established a keyboard, landmark, semantic-table, focus,
reduced-motion, and responsive baseline. Because the later sculpted pass materially changed
layout density and removed dark mode, full breakpoint visual regression and automated
accessibility checks should be rerun before treating that earlier visual report as current.

## 15. Remaining risks and opportunities

- Complete arbitrary-date coverage needs cached season fixture indexes.
- Match and team detail remain limited to entities present in the currently loaded supported
  competition snapshot; valid source IDs outside that slice can return `404`.
- Live is necessarily an estimate until the source exposes an authoritative live state/clock.
- Qualification/relegation zones require explicit competition-rule data.
- A non-current competition matchday uses a bounded `Promise.race`, but its losing request is
  not aborted; end-to-end cancellation would reduce background work during upstream degradation.
- Every match list currently uses the large sculpted board. Production usability should decide
  whether dense fixture pages need a compact variant.
- A command palette can follow the dedicated accessible search route; it is not required for first release.
- Visual regression and automated accessibility tooling remain worthwhile follow-up work.
