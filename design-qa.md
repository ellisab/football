**Comparison Target**

- Source visual truth: `/var/folders/wq/vxdybprx2hxf69zpn1yfzc9w0000gn/T/TemporaryItems/NSIRD_screencaptureui_o76GBt/Screenshot 2026-07-20 at 00.53.27.png` (reported Favorites defect) and `https://www.spieltag.day/today?date=2026-08-09` captured at `/private/tmp/football-today-canonical.png` (canonical Heute card).
- Rendered implementation: `http://127.0.0.1:3000/favorites` captured at `/private/tmp/football-favorites-after.png`; mobile capture at `/private/tmp/football-favorites-mobile.png`.
- Viewports: 1280 × 720 desktop and 390 × 844 mobile.
- State: 1. FC Nürnberg favorited; relevant 2. Bundesliga and DFB-Pokal fixtures visible. The canonical Heute comparison uses the 9 August 2026 fixtures so the Nürnberg–Dresden card is present in both views.
- Full-view comparison evidence: `/private/tmp/football-card-target-comparison.png` (canonical Heute on the left, local Favorites on the right). The normalized defect comparison is `/private/tmp/football-favorites-comparison.png` (deployed Favorites before on the left, local Favorites after on the right).
- Focused comparison: not needed. At original resolution, each full-view capture makes the card typography, badge assets, center signal, spacing, radii, and shadows clearly legible; DOM measurements were used to confirm the exact widths and overflow behavior.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Favorites uses the same `SculptedMatch` renderer as Heute/Live. Team names now receive 207px per track on desktop instead of 31px, removing the unintended ellipsis and stacked fragments while preserving the established weights, sizes, line heights, and status treatment.
- Spacing and layout rhythm: canonical Heute and Favorites cards both measure 1040px at the 1280px viewport. All shared match lists are capped at 65rem and centered; the card gaps, radii, elevation, and vertical rhythm match. The 390px mobile viewport renders 358px-wide cards with a 390px document width and no horizontal overflow.
- Colors and visual tokens: unchanged shared tokens and component styles are used throughout; no route-specific color drift was introduced.
- Image quality and asset fidelity: the existing team badge assets and badge surfaces are reused without substitutions, cropping, or scaling artifacts.
- Copy and content: competition, round, team, kickoff, and status content remains driven by the same data and shared component. Favorites sorting and filtering are unchanged; 12 matches remain the initial batch while every remaining match is now accessible progressively.
- Accessibility and interaction: the favorite-team control was exercised through the UI, persisted to Favorites, and the linked match cards retained their accessible game labels. The progressive reveal was verified from 12 of 19 to 19 of 19 matches, removed its button when complete, reset when the favorite selection changed, and issued no additional server request. Team Detail also renders its fixtures through the canonical shared list. Browser console warnings/errors checked: none.

**Comparison History**

- Iteration 1 — [P2] Desktop team names were unreadable in Favorites. Evidence: the deployed Favorites capture measured a 688px card and only 31px of rendered width per team-name track, despite 79–90px of content, matching the truncation in the supplied screenshot.
- Fix: introduced a lean `MatchCardItem`/`MatchCardList` adapter so Favorites shares the canonical renderer without serializing full competition models, routed Team Detail through `MatchList`, introduced the shared `match-feed-page` width used by Heute/Live, and capped every canonical match list at 65rem.
- Post-fix evidence: Favorites and canonical Heute both measure 1040px; the Nürnberg and Dresden name tracks each measure 207px with no truncation. Competition lists now use the same 1040px cap. Mobile verification found no page overflow.

**Open Questions**

- None.

**Implementation Checklist**

- [x] Use the canonical shared match-card list path in Favorites.
- [x] Use the canonical `MatchList` path in Team Detail.
- [x] Share the Heute/Live desktop feed width with Favorites and Team Detail.
- [x] Cap shared match lists to one consistent site-wide card width.
- [x] Reveal additional favorite matches in batches of 12 without another data request.
- [x] Verify desktop and mobile favorite flows in the browser.
- [x] Check console errors, types, lint, and automated tests.

**Follow-up Polish**

- No P3 follow-up is required for this change.

final result: passed
