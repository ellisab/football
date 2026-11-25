# Champions League broadcast dock design QA

- Source visual truth: `/Users/alex/Desktop/Screenshot 2026-08-29 at 19.52.48.png`
- Browser-rendered implementation: `/tmp/football-champions-league-viewport.png`
- Focused implementation crop: `/tmp/football-champions-league-dock.png`
- Route: `http://localhost:3000/competitions/champions-league?season=2026`
- Viewport: 430 × 900 CSS px, device pixel ratio 1
- Source pixels: 428 × 112
- Implementation focus pixels: 416 × 128
- State: first Champions League round, Tuesday fixture showing `prime`, `DAZN`, and `08.09.2026`
- Density normalization: both images were inspected at original pixel density. The source is a tighter crop of the existing Bundesliga dock; the implementation crop retains surrounding match-card context so alignment and attachment to the card can be judged.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the Champions League dock reuses the existing stadium-body family, weight, tabular date numerals, and compact broadcaster marks from the Bundesliga dock. The intentional copy differences are `prime`, `DAZN`, and the Champions League fixture date.
- Spacing and layout rhythm: the pill remains centered against the match card with the same border, radius, padding, elevation, and responsive sizing rules as Bundesliga and 2. Bundesliga.
- Colors and visual tokens: background, border, text, muted icon, and shadow values are inherited from the same production component and tokens as the reference.
- Image quality and asset fidelity: no raster assets are introduced. The existing Lucide TV icon and code-native broadcaster wordmarks are reused consistently with the established component.
- Copy and content: Tuesday correctly shows both possible German services (`prime` and `DAZN`) plus the OpenLigaDB fixture date. Wednesday and other non-Tuesday fixtures show `DAZN` plus the date.

## Full-view comparison evidence

The 430 × 900 browser capture shows the dock attached to the bottom center of the first Champions League match card without overlap, clipping, or horizontal overflow. The surrounding card retains its existing team, kickoff, and round hierarchy.

## Focused-region comparison evidence

The source and focused implementation crop were opened together. The implementation uses the same rounded white dock treatment, TV icon placement, broadcaster wordmarks, date alignment, border, and shadow language. Width differs intentionally because the broadcaster content differs from the Bundesliga reference and the implementation was captured at a 1× responsive viewport.

## Interaction and runtime verification

- Champions League route loaded with 18 current fixtures from OpenLigaDB.
- The first match card navigated to `/matches/87388`, and its match-detail heading rendered.
- Browser console errors checked: none.
- Responsive card and dock checked at 430 × 900.

## Comparison history

No visual P0/P1/P2 issue was found in the normalized comparison, so no corrective visual iteration was required.

## Follow-up polish

None required for this request.

final result: passed
