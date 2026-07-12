# spieltag.day Theme Recommendation

## Recommendation

Adopt a **hybrid theme** that combines the existing website's usability with the new concept's premium visual identity.

The existing Matchday Signal design should remain the structural foundation. It is compact, easy to scan, responsive, and suitable for pages containing many matches or competitions. The new white sculptural theme should become the visual layer that makes `spieltag.day` distinctive and memorable.

The goal is not to reproduce the concept image everywhere. Instead, use its strongest qualities selectively while preserving the product's speed and clarity.

## Why the New Direction Works

The proposed theme gives `spieltag.day` a stronger identity than a conventional football scores website. Its main strengths are:

- A calm, premium presentation that avoids the visual noise common in sports products.
- A memorable three-dimensional scoreboard that can become a signature brand element.
- Generous spacing and restrained typography that make important scores feel prominent.
- A nearly monochrome palette that separates the product from betting and advertising-heavy football sites.
- A visual language that fits the name `spieltag.day`: focused, direct, and centered on the matchday.

## What Should Be Preserved

The current design remains stronger for frequent use and information-heavy pages. Preserve:

- Compact, vertically scannable match lists.
- Clear competition and status grouping.
- Familiar navigation and page structure.
- Strong responsive behavior on small screens.
- Semantic status colors and accessible contrast.
- Efficient use of space below the primary content.

Replacing these elements with large decorative cards would make the website less useful, particularly for users checking several matches quickly.

## Recommended Design System

### Visual foundation

- Use a warm white page background rather than pure white.
- Build surfaces from subtly different white and pale-gray tones.
- Use thin gray borders to define interactive areas reliably.
- Apply soft shadows only to important raised elements.
- Use charcoal text with sufficient contrast instead of very light gray typography.
- Keep corner radii refined and consistent rather than excessively rounded.

### Typography

- Use an elegant, modern sans-serif with a restrained editorial character.
- Give scores and important headings generous scale and light-to-medium weight.
- Keep match metadata compact and highly readable.
- Use letter-spaced uppercase labels only for dates, competition names, and small contextual headings.

### Color

The interface should remain predominantly monochrome. Color should communicate meaning rather than decorate the page:

- Red for confirmed live status.
- Green only when it communicates a positive or completed state.
- Muted gray for finished matches and secondary metadata.
- Competition or team colors only as small accents, never as large backgrounds.

### Depth and motion

- Reserve the sculpted, three-dimensional treatment for the featured match, score displays, and selected controls.
- Use restrained hover elevation or border changes for interactive cards.
- Keep animations short and subtle.
- Consider a gentle pulse for the live indicator, while respecting reduced-motion preferences.

## Component Strategy

### Featured match

The floating scoreboard should be used as the signature component for:

- The most relevant live match on the homepage.
- A user's favorited or selected match.
- The hero area of a match-detail page.
- Major tournament knockout matches or finals.

It should show team names, badges, score, match time, and status without requiring interaction. On mobile, it should become a compact horizontal score card rather than retaining the oversized desktop proportions.

### Match lists

Keep the current compact match-list structure. Restyle it with:

- White raised rows on a warm-white canvas.
- Hairline borders and very soft shadows.
- Strong alignment between teams, kickoff time, and score.
- Clear live, upcoming, and finished states.
- Minimal team-color accents around badges or status markers.

### Navigation and controls

- Keep the existing information architecture.
- Simplify the header visually and give it more breathing room on desktop.
- Use sculpted controls selectively for the active date or selected matchday.
- Ensure every interactive element remains clearly identifiable without depending on shadows alone.

### Competition pages and tables

Competition directories, standings, and long matchday pages should favor density over spectacle. They can inherit the palette, typography, borders, and spacing of the new theme without using large three-dimensional hero elements.

## Accessibility Requirements

The reference image is intentionally pale, but a functional website needs stronger contrast. The implementation should:

- Meet WCAG AA contrast requirements for text and controls.
- Retain visible borders around inputs, buttons, and selected states.
- Never communicate live or finished status with color alone.
- Provide clear keyboard focus styles.
- Avoid placing important information inside low-contrast embossed surfaces.
- Preserve readable type sizes and comfortable touch targets on mobile.

## Suggested Rollout

1. Introduce the new palette, typography, borders, and surface treatments through shared design tokens.
2. Restyle the header, date navigator, match rows, and section headings without changing their behavior.
3. Build the sculpted featured-match component as an optional homepage module.
4. Adapt the featured component for match-detail pages and mobile layouts.
5. Test readability, keyboard navigation, reduced motion, and common viewport sizes.
6. Evaluate whether the featured module improves engagement before extending the three-dimensional treatment elsewhere.

## Final Direction

The new concept is the better **brand direction**, while the existing theme is the better **product foundation**. Combining them should produce a website that feels premium and unmistakably `spieltag.day` without making scores slower to find.

The guiding principle should be:

> Use dimensional design to create focus, and compact design to deliver information.
