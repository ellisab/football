# Spieltag: Definitive Football Product Redesign

Status: implemented product specification and verification record for the 2026 rebuild.

This document is the product, UX, visual, accessibility, data, and engineering source of truth for the redesign. It is grounded in the current Next.js repository and the fields OpenLigaDB actually exposes.

## 1. UX audit

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

### Retain

- Next.js App Router and Server Components by default.
- OpenLigaDB typed transport types, data-source abstraction, retry/backoff, caching, and last-change matchday cache.
- League discovery, season resolution, matchday loading, World Cup normalization, and tie grouping.
- `TeamBadge` host validation, Next Image sizing, and missing-image fallback.
- Berlin date utilities, match IDs, competition slugs, narrow matchday API, and compatibility API routes.
- Semantic desktop table foundation and reduced-motion support.

### Redesign

- `HomeView`, full-screen `HomeHero`, duplicated headers, context rail, and ticker.
- The three competing match-card anatomies.
- Standings zone/form presentation.
- Team and match pages as direct, contextual journeys.
- All global states, navigation, themes, search, favorites, and route-specific data loaders.

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
- `/teams` and `/teams/[teamId]` — team browse and team detail.
- `/matches/[matchId]` — direct match detail even when absent from the overview slice.
- `/search?q=...` — universal, shareable search.
- `/favorites` — locally prioritized teams and competitions.

Legacy `/?league=&season=` and the existing API routes remain compatible during migration.

### Desktop navigation

- Product identity.
- Today.
- Live.
- Competitions.
- Teams.
- Favorites.
- Search.
- The user’s system theme preference.

The global header remains compact and sticky. Route-specific context bars live inside pages because season, matchday, and date belong to the URL and cannot be reliably inferred by the root layout.

### Mobile navigation

- Compact top bar: identity and search; color mode follows the user’s system theme.
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

## 4. Three visual directions

### Direction A: Matchday Signal — recommended

- **Concept:** stadium wayfinding plus a precise live instrument.
- **Character:** immediate, calm, confident, modern.
- **Typography:** Space Grotesk for product/editorial hierarchy; JetBrains Mono for time, scores, and standings.
- **Color:** warm paper-like light theme and deep slate dark theme; one signal red/coral live token, one blue action token, restrained competition accents.
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

## 5. Selected direction

**Matchday Signal** is selected because it best serves the product principle “every score and every competition is one step away.” It gives Today and Live the strongest information hierarchy, adapts to 320px without hiding essential match data, supports semantic light and dark themes, and can be maintained with a small token system rather than decorative one-off components.

The emotional identity comes from rhythm, typography, live language, team crests, and precise competition accents—not from a full-screen stadium image or fictional statistics.

## 6. Design system

### Tokens

- Spacing: 4, 8, 12, 16, 20, 24, 32, 48, 64px.
- Content widths: 760px reading/list column; 1180px full shell.
- Radius: 8px controls, 12px rows, 16px primary surfaces, pill only for status/actions.
- Type: 12 metadata, 14 compact, 16 body, 20 section, 28 page, 40 desktop display.
- Motion: 120ms feedback, 180ms state changes; no ambient motion except a restrained live marker.
- Shadow: one subtle elevation tier for floating navigation/dialogs; dense rows use borders, not blur.
- Breakpoints: 640px compact/tablet, 900px navigation/layout, 1200px wide content.

### Semantic colors

- `canvas`, `surface`, `surface-raised`, `surface-subtle`.
- `text`, `text-muted`, `text-soft`, `border`, `border-strong`.
- `action`, `action-contrast`, `focus`.
- `live`, `live-surface`, `finished`, `upcoming`, `unknown`.
- Competition accent is decorative and never the only status cue.

Light and dark themes use the same semantic roles. Dark mode is deep slate rather than pure black; light mode is warm neutral rather than sterile white.

### Interaction rules

- Every interactive element has default, hover, focus-visible, active, and disabled states.
- Status always combines text with shape/icon where useful.
- Whole match rows are clickable only when a real match ID exists.
- Missing IDs render a non-interactive `<article>`, never `href="#"`.
- Focus rings use a 2px high-contrast outline with offset.
- Reduced motion disables transforms and score transitions.

### Density

- Comfortable: mobile and primary Today lists.
- Compact: desktop multi-match lists.
- Detail: match page with periods, goals, venue, and context.

## 7. Page-by-page specification

### Today

- **Purpose:** answer what is happening on the selected date within one second.
- **Hierarchy:** date navigator → favorite spotlight → live → upcoming → finished, grouped by competition.
- **Primary action:** open a match.
- **Secondary:** change date, open competition, favorite content.
- **Mobile:** single column, sticky date context, comfortable rows.
- **Desktop:** centered list with compact rows and competition summary rail.
- **Edges:** no matches, incomplete date index, partial competition failure.

### Live

- **Purpose:** focus on unfinished recent-kickoff matches without overstating API certainty.
- **Hierarchy:** last checked → live-estimate matches → next upcoming matches when empty.
- **Primary action:** open match.
- **Edges:** no live matches, offline, stale update, source cannot confirm status.

### Competitions

- **Purpose:** expose every supported competition and season without a deep hierarchy.
- **Hierarchy:** search/filter → favorites → complete directory.
- **Primary action:** open competition.
- **Edges:** temporarily unavailable season metadata.

### Competition overview and matchday

- **Purpose:** complete competition command center.
- **Hierarchy:** competition/season/status → matchday controls → matches/standings view.
- **Primary action:** inspect selected matchday.
- **Secondary:** previous/next/current matchday, season, standings, favorite.
- **Mobile:** scroll-free primary controls, native select for direct jump, stacked match rows.
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
- **Edges:** team known but no nearby matches, missing crest, partial snapshot.

### Match detail

- **Purpose:** present the verified match story with excellent hierarchy.
- **Hierarchy:** status/competition → teams/score → date/venue/matchday → period results → goals → adjacent context.
- **Edges:** missing score/time/venue, unknown status, no goals, match absent from overview.
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

- 320px: no horizontal page overflow; four-item bottom navigation; score remains visible; long names truncate once.
- 375/430px: comfortable match rows and full date controls.
- Tablet portrait: one main column with contextual cards.
- Tablet landscape: main list plus compact context rail.
- Laptop: compact rows and persistent global header.
- Wide desktop: whitespace expands; rows do not become oversized.
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
- Both themes meet AA text and focus contrast.
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
- Missing kickoff: schedule pending.

### Date strategy

OpenLigaDB has no all-competitions-by-date endpoint. Complete arbitrary-date support requires cached whole-season fixture indexes per supported competition, indexed by Berlin date and refreshed narrowly by matchday. Until that index is complete, the UI must label its available scope and never imply a complete date result when data is partial.

## 11. Component architecture

```text
AppShell (server)
├── AppHeader
│   ├── PrimaryNav (small client active-state island)
│   ├── SearchLink
│   └── System color-scheme styles (CSS)
├── RouteContextBar (server)
├── Page content (server-first)
├── MobileNav (small client active-state island)
└── SiteFooter

Football presentation
├── CompetitionIdentity
├── DateNavigator
├── SeasonSelector
├── MatchdayNavigator
├── FavoriteButton (client)
├── MatchList
│   └── MatchSummary
│       ├── TeamIdentity
│       ├── ScoreDisplay
│       └── MatchStatusBadge
├── StandingsTable
├── TeamSummary
├── MatchEventList
├── EmptyState
├── ErrorState
└── SkeletonState

Feature islands
├── FavoriteSpotlight
├── SearchExperience
├── CompetitionDirectoryFilter
└── LiveUpdateController
```

Server Components remain the default. Client code is limited to active navigation, theme, local favorites, progressive search filtering, and focused live updates.

## 12. Implementation plan

1. Add pure normalized status/query/search/favorites utilities and tests.
2. Introduce semantic light/dark tokens, compact global shell, skip link, and responsive mobile navigation.
3. Build one reusable match anatomy and truthful standings table.
4. Rebuild `/` and `/today?date=`; add `/live`.
5. Add `/competitions` and a URL-driven competition command center.
6. Make match pages direct and remove unsupported stats; refine team pages.
7. Add `/search` and versioned local `/favorites` behavior.
8. Add app-level loading, error, empty, and 404 states.
9. Remove obsolete hero/navigation/card implementations after reference checks.
10. Verify every route, theme, breakpoint, keyboard path, state, and build gate.

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
- Focused route-specific pages and smaller payloads.
- Stable desktop header and thumb-reachable mobile navigation.
- Shareable date, search, season, matchday, and view state.
- Honest OpenLigaDB status and missing-data semantics.
- One reusable match anatomy and semantic standings table.
- Intentional light/dark themes and complete route states.

### Production implementation map

- Global shell and system-driven themes: `src/features/shell/**`, `src/app/layout.tsx`, and semantic tokens in `src/app/globals.css`.
- Score-first Today and date state: `src/features/today/**`, `/`, and `/today?date=YYYY-MM-DD`.
- Honest live experience and one visibility-aware refresh controller: `src/features/live/**` and `/live`.
- Competition directory and command center: `src/features/competitions/**`, `/competitions`, and URL-driven season, matchday, scope, and view controls.
- Match presentation and normalized status guardrails: `packages/core/src/matches/**` and `src/features/football/components/match-summary.tsx`.
- Local favorites and forgiving search: `src/features/favorites/**`, `src/features/search/**`, `/favorites`, and `/search?q=`.
- Team and match journeys: bounded team-history loading, direct match loading, verified goal/period detail, and adjacent match context.
- Global route states: `src/app/loading.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx`.
- Retired implementation: the full-screen hero, duplicate route frame, duplicate match card, horizontal context rail, old polling layer, and legacy World Cup/Champions League presentation tree were removed.

## 14. Validation plan

- Install with frozen lockfile.
- Unit tests for status, date/query parsing, search ranking, favorite serialization, and partial data.
- Existing core/API tests.
- ESLint, strict TypeScript, Knip, and production build.
- Route discovery and direct URL reloads.
- Search, favorites persistence, competition/season/matchday/date switching.
- Keyboard-only traversal and focus visibility.
- Screen-reader-oriented snapshots for match labels, landmarks, tables, and live region.
- 320, 375, 430, tablet portrait/landscape, laptop, and wide desktop.
- Light, dark, system theme, reduced motion, and no horizontal overflow.
- Loading, no matches, no live matches, invalid route, partial API failure, and total API failure.
- Browser console/network audit and focused polling audit.
- Core Web Vitals risk review: image priority, JS boundaries, font count, layout stability, and request fan-out.

### Validation report

Completed against the production code:

- `pnpm run test`: 72 tests passed, including status provenance, nullable scores, Berlin date parsing/shifting, favorite persistence/migration, search ranking, matchday loading, direct match loading, and bounded team fixtures.
- `pnpm run typecheck`: strict TypeScript and generated Next.js route types passed.
- `pnpm run lint`: repository-wide ESLint passed.
- `pnpm dlx knip`: no unused files, dependencies, or exports reported.
- `pnpm run build`: production build passed with all primary and compatibility routes in the route manifest.
- `git diff --check`: no whitespace errors.
- Accessibility audit: one application `main`, skip link, route-level `h1`, semantic tables, `aria-current`, decorative crest handling, labelled native date/select controls, 44px interactive targets, polite favorite/live feedback, non-color status text, focus-visible rules, and reduced-motion handling were verified in the rendered application.
- Static performance audit: the 2.7MB hero is no longer requested, Bungee was removed from the font payload, Server Components remain the default, legacy presentation code was deleted, and live refresh is a single visibility-aware client island.
- Agent-browser route and responsive verification passed at 320, 375, 430, 768, 900, 1024, and 1440px. Every tested page reported `scrollWidth === viewport width`, one `main`, one `h1`, and the expected mobile/desktop navigation mode.
- Browser interaction verification passed for previous-date/back navigation, direct matchday selection with a bounded failure fallback, matches/standings switching, direct match/team pages, search typing and shareable query submit, `/` search shortcut, favorite persistence and Today prioritization, manual live refresh, and 404 recovery actions.
- System light/dark emulation selected the intended semantic palettes with no UI toggle or stored theme override. Reduced-motion emulation reduced transitions to effectively zero.
- Keyboard verification passed for the skip link, focus transfer to `main`, logical next focus, and visible 3px focus treatment.
- Browser console inspection found no application errors. The match-detail network audit showed no obsolete hero request or unsupported-statistics request.
- A local development Web Vitals sample for the competition route measured 116ms TTFB, 1.13s FCP/LCP, and zero CLS. This is a directional local sample, not a substitute for production RUM.

## 15. Remaining risks and opportunities

- Complete arbitrary-date coverage needs cached season fixture indexes.
- Bounded direct team history is implemented, but team identity and competition mapping still depend on the source IDs and supported competition catalog.
- Live is necessarily an estimate until the source exposes an authoritative live state/clock.
- Qualification/relegation zones require explicit competition-rule data.
- Matchday and direct-team requests use bounded UI fallbacks, but the losing promise in the timeout race is not yet aborted; adding end-to-end cancellation would reduce background work during upstream degradation.
- A command palette can follow the dedicated accessible search route; it is not required for first release.
- Visual regression and automated accessibility tooling can be added after the zero-dependency product vertical slice is stable.
