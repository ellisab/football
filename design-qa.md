# Shared Match Card Design QA

## Comparison target

- Source visual truth:
  - `/Users/alex/Desktop/Screenshot 2026-07-13 at 13.43.54.png` — user-selected Heute/Live card.
  - `/private/tmp/football-match-card-design-qa/today-1440-card-reference.png` — live desktop reference at 1440 × 900.
  - `/private/tmp/football-match-card-design-qa/today-390-card-reference.png` — live mobile reference at 390 × 844.
- Implementation screenshots:
  - `/private/tmp/football-match-card-design-qa/detail-1440-viewport-final.png`
  - `/private/tmp/football-match-card-design-qa/detail-390-viewport-final.png`
- Route and state: `/matches/84682`, France vs Spain, upcoming at 21:00, `Geplant`.
- Responsive checks: 320 × 844, 390 × 844, 768 × 1024, and 1440 × 900.

## Full-view comparison evidence

The Heute reference and match-detail implementation captures were opened together for desktop and mobile comparison. The detail page now renders the same `featured-match` component tree and the same responsive CSS as Heute/Live. Detail-only competition navigation, full kickoff, round, venue, team links, favorite controls, goals, and result phases remain outside the shared card.

At 1440px, the source and detail boards both measure 1040 × 240px. At 390px, both measure 358 × 176px. The visual order, team badges, names, score placeholders, center dial, competition/round line, surface, radius, and shadow match because they are the same component rather than parallel implementations.

## Focused-region comparison evidence

The 1440 and 390 viewport captures keep the full card large enough to inspect typography, alignment, badge treatment, center dial, border, radius, and shadow without a further crop. Computed geometry was also compared at each relevant breakpoint:

- 320px: detail board 296 × 176px; no horizontal overflow.
- 390px: source and detail boards 358 × 176px; no horizontal overflow.
- 768px: source and detail boards 720 × 240px; no horizontal overflow.
- 1440px: source and detail boards 1040 × 240px; no horizontal overflow.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the exact shared team-name, score, time, status, competition, and round classes are used in both surfaces. Font family, weight, size, line height, letter spacing, wrapping, and truncation therefore match at each breakpoint.
- Spacing and layout rhythm: card dimensions and grid geometry match at desktop, tablet, mobile, and narrow-mobile widths. Detail-only controls sit below a separate divider and do not alter the shared card.
- Colors and visual tokens: the detail card uses the same gradients, surfaces, borders, semantic live color, muted text, and shadows as Heute/Live. No new card palette was introduced.
- Image quality and asset fidelity: existing `TeamBadge` assets and fallbacks are reused unchanged. No raster assets, substitute illustrations, custom SVGs, or placeholder artwork were added.
- Copy and content: competition, round, team names, score placeholders, time, and `Geplant` appear in the same positions. The duplicate detail status pill and alternate `– : – / 21:00` hierarchy were removed.
- Accessibility: the list card remains one keyboard-focusable link. The detail card is a static labelled article with no self-link, no false `Spiel öffnen` affordance, and one page `h1`. Team links and 44px favorite buttons remain sibling controls with explicit labels and `aria-pressed` state.

## Comparison history

1. The first rendered desktop check exposed a P1 width mismatch: the detail preview still showed the old 48rem stylesheet while Heute used the 70rem canvas. The page-scoped 70rem rule was applied in the refreshed stylesheet. Post-fix evidence shows both boards at 1040 × 240px at 1440px.
2. The post-fix desktop comparison found no remaining component mismatch.
3. The mobile comparison confirmed the same 358 × 176px card at 390px. Narrow-phone and tablet geometry also matched their Heute/Live counterparts with no overflow, so no further responsive fix was required.

## Interaction and runtime checks

- Clicking the unique Heute card navigated to `/matches/84682`.
- The destination rendered the shared card as an article, with no `/matches/84682` self-link.
- The France favorite button toggled its pressed state and accessible label correctly; the test state was restored afterward.
- Competition, team, previous-match, and next-match links remained present.
- Browser console errors and warnings in the clean interaction tab: none.
- React review: named components, Server Component boundaries, stable semantics, native links/buttons, TypeScript props, and the existing client-only favorite island remain sound.
- Automated verification: ESLint, TypeScript, 133 tests, production build, focused component regression tests, and `git diff --check` passed.

## Follow-up polish

No P3 follow-up is required for this scoped shared-card change.

final result: passed
