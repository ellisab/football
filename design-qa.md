# Search Field Design QA

## Comparison target

- Source visual truth:
  - `/Users/alex/Desktop/WhatsApp Image 2026-07-12 at 10.37.23 PM.jpeg` — selected competition-directory structure and proportions.
  - `/Users/alex/Desktop/WhatsApp Image 2026-07-12 at 10.36.57 PM.jpeg` — original global-search variant used to identify the inconsistency.
- Implementation screenshots:
  - `/private/tmp/football-search-design-qa/search-390-final.png`
  - `/private/tmp/football-search-design-qa/competitions-390-final.png`
  - `/private/tmp/football-search-design-qa/teams-390.png`
  - `/private/tmp/football-search-design-qa/search-320-empty-after-fix.png`
  - `/private/tmp/football-search-design-qa/search-320-query-final.png`
  - `/private/tmp/football-search-design-qa/search-768-final.png`
  - `/private/tmp/football-search-design-qa/competitions-768-final.png`
  - `/private/tmp/football-search-design-qa/search-1440-final.png`
  - `/private/tmp/football-search-design-qa/competitions-1440-final.png`
  - `/private/tmp/football-search-design-qa/teams-1440-final.png`
- Viewports: 320 × 844, 390 × 844, 768 × 1024, and 1440 × 900.
- States: empty and focused global search, populated global search, visible clear action, cleared query, directory search, and responsive stacked submit.

## Full-view comparison evidence

The supplied mobile references and the 390 × 844 implementation captures were opened together. The implementation intentionally preserves each page's surrounding layout while giving every search control the competition-directory structure: one bordered field shell, an inline icon and input, and the same inset submit action. At 390px and above, global search, competitions, and teams all render a 56px field and a 44px submit action. At 320px, every submit action follows the same full-width second-row rule.

## Focused-region comparison evidence

The following crops were opened in one comparison input so control geometry remained readable:

- `/private/tmp/football-search-design-qa/reference-search-control.png`
- `/private/tmp/football-search-design-qa/reference-competition-control.png`
- `/private/tmp/football-search-design-qa/implementation-search-control.png`
- `/private/tmp/football-search-design-qa/implementation-competition-control.png`

The new global and competition controls have matching button height, radius, horizontal padding, text treatment, and field radius. Their overall widths differ only because `/search` uses the narrower content column and an inset search card, which is an intentional page-level constraint.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: existing product fonts and weights are preserved. Search inputs are standardized at 16px with a 1.5 line height; submit text continues to use the existing primary-button typography.
- Spacing and layout rhythm: computed values match across consumers — 56px field height, 44px input and button minimum height, 14.4px field radius, 11.2px button radius, and 14.4px horizontal button padding.
- Colors and visual tokens: the shared control uses the existing surface, border, action, contrast, muted-text, and focus tokens. No new palette values were introduced.
- Image quality and asset fidelity: no raster assets were added or replaced. The existing Lucide search and clear icons are reused at their existing visual weight.
- Copy and content: labels, placeholders, submit copy, status copy, result content, and page descriptions remain unchanged.
- Accessibility: labels stay associated with their inputs, controls remain native input/button elements, input text is 16px, touch targets are at least 44px, and `:focus-within` visibly marks the complete field.

## Comparison history

1. Initial migration: the three pages rendered the same 56px/44px geometry at 390px, 768px, and 1440px.
2. First 320px pass found a P2 text-pressure issue: the inactive clear action reserved 44px and shortened the empty placeholder. The clear action now renders only when a query is present.
3. Populated 320px search found a P2 reflow issue: result-item minimum content widened the document to 350px and could pull the clear action off-screen. Minimum-width constraints were added to the search form, result groups, lists, and list items. Post-fix evidence reports `documentWidth: 320`, `horizontalOverflow: false`, a 262px field, and 262px result rows.
4. Focus review found a P2 resilience gap in an input-specific `:has(...)` selector. It was replaced with the shared shell's `:focus-within` state. Post-fix captures show the outer focus treatment while button and clear controls retain their own keyboard focus indication.

## Interaction and runtime checks

- Global search typing produced ranked results and exposed the clear action.
- The clear action emptied the query, removed results, and returned focus to the input.
- Competition search submitted through its native submit button and produced a `?q=` URL.
- `/`, `/search`, `/competitions`, and `/teams` rendered meaningful content without a framework error overlay.
- Browser console errors: none.
- Automated checks: full ESLint, typecheck, 130 tests, and production build passed.

## Follow-up polish

No P3 follow-up is required for this scoped consistency fix.

final result: passed
