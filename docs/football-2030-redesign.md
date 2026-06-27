# Football 2030 Redesign Direction

## Product Thesis

The site should feel like a live football broadcast rebuilt as a premium daily utility. A fan opens it, understands the day in three seconds, then keeps browsing because every competition, match, table, and team page feels fast, emotional, and beautifully organized.

Working title: **Spieltag Orbit**.

The current product already has a strong dark stadium language in `HomeHero`, `LeagueTabs`, `MatchCard`, `StandingsCard`, and `WorldCupPanel`. The redesign should evolve that foundation into a sharper football operating system: cinematic above the fold, compact and scannable everywhere else.

## Design Principles

1. **Scores first, atmosphere second.**
   The user should never hunt for kickoff time, score, status, competition, or table position. Cinematic visuals frame the data; they do not compete with it.

2. **One glance tells the story.**
   Every screen answers: where am I, what competition is this, men's or women's, what matchday or round, what is live, what just finished, what is next.

3. **Broadcast energy, SaaS clarity.**
   Use motion, light, badges, flags, and team color accents like a premium match feed, but use spacing, hierarchy, and predictable controls like excellent product software.

4. **Mobile is the flagship.**
   The mobile layout is not a compressed desktop. It is the primary score-checking experience: thumb-friendly, sticky controls, swipeable match strips, dense but calm lists.

5. **Every competition has identity.**
   World Cup, Bundesliga 1, Bundesliga 2, women's leagues, men's leagues, cups, and international competitions should carry distinct accenting through flags, badges, colors, trophy shapes, and subtle background treatment.

## Visual Identity

### Core Look

The product should feel like a night match in a futuristic stadium: dark glass, crisp floodlight edges, luminous score data, and controlled bursts of team color.

Use fewer huge rounded poster cards and more layered surfaces:

- **Base:** deep near-black stadium surface.
- **Data surfaces:** translucent graphite panels with thin white keylines.
- **Live surfaces:** electric cyan glow, animated but restrained.
- **Prestige surfaces:** champagne gold for trophies, leaders, qualification, and major moments.
- **Danger surfaces:** warm ember and red for relegation, penalties, errors, and late drama.

### Palette

Keep the current gold/cyan identity, but expand it into a balanced football palette.

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Stadium Night | `--surface-night` | `#050A0D` | Page background, app shell |
| Pitch Black-Green | `--surface-pitch` | `#071416` | Main content bands |
| Broadcast Glass | `--surface-glass` | `rgba(237,246,239,.07)` | Cards, panels |
| Line White | `--line-soft` | `rgba(237,246,239,.12)` | Dividers, borders |
| Trophy Gold | `--accent-gold` | `#DCBC6E` | Winners, primary CTA, rank 1 |
| Floodlight Cyan | `--accent-cyan` | `#72D9E4` | Live, links, focus, timing |
| Signal Orange | `--accent-orange` | `#EFAA57` | Important upcoming, warnings |
| Pitch Green | `--accent-green` | `#43C886` | wins, positive movement, form |
| Result Red | `--accent-red` | `#EF5F5F` | losses, relegation, errors |
| Ice Text | `--text-high` | `#EDF6EF` | Primary text |
| Mist Text | `--text-mid` | `#A9C0B6` | Secondary text |
| Ghost Text | `--text-low` | `#6F837B` | Metadata |

Avoid making the interface only dark blue, only gold, or only green. Team colors should appear as controlled accents on match/team surfaces, not as full-page themes.

### Typography

Current fonts:

- `Space Grotesk` works well for UI and should remain the main product typeface.
- `JetBrains Mono` should be used for times, score metadata, compact stats, and table numbers.
- `Bungee` is dramatic but should be used sparingly. It can stay for campaign-like hero moments, but not for every heading.

Recommended direction:

- **Display:** Sora ExtraBold or Space Grotesk Bold for premium, sharp sports headlines.
- **UI/body:** Space Grotesk 400-700.
- **Data:** JetBrains Mono 500/600 for kickoff time, xG-style values, minute markers, table deltas.

Scale:

- Mobile hero: 42-52px, tight line height.
- Desktop hero: 72-96px, not more than 2 lines.
- Section titles: 28-40px.
- Dense UI labels: 11-13px uppercase with generous letter spacing.
- Match/team names: 15-18px, never cramped.

## Information Architecture

Navigation should be obvious, shallow, and always visible in some form.

### Primary Routes

- `/` - Today dashboard and football home.
- `/today` - all matches today across competitions.
- `/competitions/world-cup`
- `/competitions/bundesliga-1`
- `/competitions/bundesliga-2`
- `/competitions/women`
- `/competitions/men`
- `/tables`
- `/teams`
- `/matches/[matchId]`
- `/teams/[teamId]`

The existing query-param model can remain as a technical fallback, but the user-facing IA should feel route-based and memorable.

### Global Navigation

Desktop:

- Left: brand mark and current date.
- Center: `Today`, `World Cup`, `Bundesliga 1`, `Bundesliga 2`, `Women`, `Men`, `Tables`, `Teams`.
- Right: search, season selector, timezone chip, live count.

Mobile:

- Sticky top bar: brand, live count, search.
- Horizontal competition switcher below top bar.
- Bottom nav: `Today`, `Comps`, `Tables`, `Teams`, `More`.

Persistent context bar:

- Competition badge.
- Category chip: `Men` / `Women`.
- Season.
- Round or matchday.
- Status count: `3 Live`, `5 Upcoming`, `12 Finished`.

## Homepage Concept

The homepage is not a marketing page. It is **Today in Football**.

### First View

Hero module: **The Daily Kickoff**

Desktop layout:

- Full-width atmospheric football image or live match artwork behind a dark readable overlay.
- Left: headline for the biggest football story or match cluster.
- Right: "Now / Next / Final" stacked scoreboard rail.
- Bottom edge: horizontal live/upcoming match strip visible before scroll.

Mobile layout:

- Top third: cinematic hero image with compact headline.
- Middle: primary match card with score/kickoff.
- Bottom: swipeable match strip and competition chips.

Hero content examples:

- `Tonight: Germany chase the group lead`
- `Bundesliga 1 matchday opens under the lights`
- `World Cup groups: all eyes on Group B`

The hero should not hide utility. It should include:

- Date.
- Competition context.
- Matchday/round.
- Primary CTA: `View today's matches`.
- Secondary CTA: `Open tables`.

### Live/Upcoming Match Strip

Sticky, horizontally scrollable, and always one tap from the top.

Each item:

- Competition micro badge.
- Status: live minute, kickoff time, finished.
- Team badges.
- Score or `20:30`.
- Small visual state: live pulse, final check, upcoming clock.

Interaction:

- Tap opens match page.
- Swipe moves through matches.
- Desktop hover reveals venue and broadcast-style metadata.

### Quick Competition Access

Replace simple pills with **Competition Capsules**:

- World Cup: globe/trophy mark, flag accents, group/knockout count.
- Bundesliga 1: red/black accent, matchday number, table leader.
- Bundesliga 2: amber/white accent, promotion race cue.
- Women: distinct magenta/cyan or green/gold accent, clearly not secondary.
- Men: neutral premium accent, direct route into men's competitions.

Each capsule answers:

- Next kickoff.
- Live count.
- Table availability.
- Current round/matchday.

### Tables Snapshot

Homepage table snapshot should show:

- Top 5.
- Promotion/qualification/relegation zones.
- Form dots.
- "Open full table" action.

Mobile should use ranked rows, not a squeezed desktop table.

## Competition Page

Purpose: one competition, all critical context, no clutter.

Header:

- Competition identity band with badge, season, category, country/flag, and current round.
- Toggle group for `Fixtures`, `Results`, `Table`, `Teams`, `Stats` if available.
- Matchday/round carousel.

Layout:

- Mobile: context header -> matchday selector -> fixtures list -> table snapshot -> teams.
- Desktop: main fixtures column with right rail containing table snapshot, top teams, next key match.

World Cup variant:

- Hero shows tournament phase: `Group Stage`, `Round of 16`, `Quarter-finals`, `Semi-finals`, `Final`.
- Group navigation as compact tabs: `A B C D E F G H`.
- Knockout path uses a bracket spine, not a dense full bracket on mobile.

Bundesliga 1/Bundesliga 2 variant:

- Matchday carousel with `Previous`, `Current`, `Next`.
- Table race module:
  - title race.
  - European/qualification zone.
  - promotion/playoff zone for Bundesliga 2.
  - relegation zone.

Women's competitions:

- Equal visual treatment.
- Dedicated competition identity, not nested as an afterthought.
- Clear label in persistent context bar.

## Match Page

The match page should feel like opening a broadcast control room, but remain simple.

### Pre-match State

Top scoreboard:

- Team badges large and crisp.
- Team colors as thin light rails behind each side.
- Kickoff time and date centered.
- Venue, city, competition, round.
- Form capsules: last 5 results.

Primary content:

- Match facts.
- Table positions.
- Recent head-to-head if data exists.
- Upcoming context: "Winner can move to 2nd".

### Live State

Top scoreboard:

- Live minute.
- Score large and centered.
- Subtle pulse only around live status, not the whole card.
- Latest event preview below score.

Timeline:

- Vertical event spine on mobile.
- Two-sided event rail on desktop.
- Events include goal, card, substitution, halftime, fulltime.
- Goal events use gold highlight; cards use correct yellow/red.

Stats:

- Use compact comparison bars.
- Keep labels plain: possession, shots, shots on target, corners, fouls.
- If stats are unavailable, show a composed empty state instead of fake numbers.

### Post-match State

Top scoreboard:

- Final score with `FT`.
- Winning team gets a controlled gold or team-color edge.
- Timeline collapses to major moments first, expandable to all events.

Below:

- Match summary card.
- Table impact.
- Next match for each team.

## Standings Page

The table must be beautiful and brutally readable.

### Desktop Table

Columns:

- Pos.
- Movement.
- Team.
- Played.
- W-D-L.
- Goals.
- Goal difference.
- Form.
- Points.

Design:

- Sticky header.
- Horizontal row separators instead of heavy cards.
- Zone bands as thin left rail and subtle row tint.
- Points column visually strongest.
- Team row hover reveals next fixture and recent result.

Zones:

- Champion: trophy gold.
- Champions/qualification: cyan.
- Promotion/playoff: green.
- Mid-table: neutral.
- Relegation/playoff: orange/red.

### Mobile Table

Never squeeze all columns.

Primary mobile row:

- Position.
- Team badge/name.
- Form dots.
- Points.
- Movement.

Expanded row:

- Played, W-D-L, GD, goals.
- Zone label.
- Next fixture.

Use accordion expansion or swipe action. The default list must stay fast.

## Team Page

The team page is a focused club identity screen.

Header:

- Badge.
- Team name.
- Competition.
- Team colors as a subtle top light rail.
- Current table position.
- Next match.

Sections:

- Upcoming matches.
- Recent results.
- Table position card.
- Form strip.
- Squad placeholder.
- Competition participation.

If squad data is not available:

- Show "Squad data coming later" with a player-grid skeleton.
- Do not use generic empty boxes.

## Component System

### App Shell

Use a three-layer layout:

- Global nav.
- Context bar.
- Content canvas.

The context bar is the anchor. It should always show competition, gender/category, season, round, and status summary.

### Competition Switcher

Current `LeagueTabs` should become a two-level switcher:

- Top level: `Today`, `World Cup`, `Bundesliga 1`, `Bundesliga 2`, `Women`, `Men`.
- Secondary level appears when needed: league season, group, matchday.

Visual:

- Scrollable capsules on mobile.
- Segmented control on desktop.
- Active state uses competition accent plus a tiny live/status count.

### Match Card

Current `MatchCard` should split into three variants:

- `MatchTickerCard` for horizontal strips.
- `MatchListRow` for competition fixture lists.
- `MatchHeroCard` for featured matches.

Shared anatomy:

- Status chip.
- Competition chip.
- Teams and badges.
- Score/time.
- Venue.
- Latest event if available.

State styling:

- Upcoming: quiet glass, cyan clock.
- Live: cyan pulse, minute badge, latest event.
- Finished: subdued gold/white score, `FT`.
- Postponed/cancelled: amber warning treatment.

### Scoreboard

New component for match pages:

- Large team badges.
- Score/time in the center.
- Competition and round above.
- Venue and date below.
- Team-color rails at the edges.

### League Table

Current `StandingsCard` should become:

- `TableSnapshot` for home and competition rails.
- `LeagueTable` for full standings.
- `MobileTableRow` for compact expansion.

Zone logic should be configurable by competition, not hard-coded by index only. Bundesliga 1, Bundesliga 2, World Cup groups, and cups need different zone rules.

### Timeline

Event module:

- Minute marker in mono.
- Icon.
- Team side.
- Player/event text.
- Score after event when relevant.

Empty state:

- Pre-match: "Timeline starts at kickoff."
- Live but no events: "Match is live. Events will appear here."
- Post-match without events: "No detailed event feed available."

### Stat Bars

Comparison bars should use neutral bars with accent fill.

Rules:

- Do not over-color every stat.
- Higher value should not always mean "better" for fouls/cards.
- Use accessible labels for screen readers.

### Team Identity Card

Use badge, colors, short competition metadata, next match, table position, and form.

This can power team pages, match preview sidebars, and table row expansions.

## States

### Loading

Use football-native skeletons:

- Scoreboard shimmer with badge circles and score block.
- Table skeleton rows with zone rails.
- Match strip shimmer.

Motion should be subtle and respect `prefers-reduced-motion`.

### Empty

Empty states should explain what is missing and what the user can do next.

Examples:

- "No matches today in Bundesliga 1. Next kickoff: Saturday 15:30."
- "Table data is not available yet. Fixtures are still visible."
- "World Cup groups have not been published for this season."

### Error

Errors should be calm and actionable.

- Source label: OpenLigaDB.
- What failed: matches, table, teams, groups.
- Retry action.
- Fallback content remains visible whenever possible.

### Live

Live status is a small but powerful system:

- One universal live token.
- Live count in nav.
- Live minute chip.
- Latest event preview.
- Animated pulse only in the status chip or line rail.

## Motion And Interaction

Use motion to make the site feel alive, never slippery.

Motion ideas:

- Hero floodlight sweep on page load.
- Match strip snaps with gentle inertia.
- Live chip pulse every 2-3 seconds.
- Score update flash: 900ms gold/cyan bloom.
- Table row movement animation after results.
- Matchday carousel with soft slide.
- Timeline event appears with minute marker first, then event text.

Rules:

- No animation should block reading.
- No large layout shifts.
- All motion disabled or reduced under `prefers-reduced-motion`.
- Keep hover states precise: lift 1-2px max, border/lighting changes preferred.

## Wow Factor Moments

1. **Kickoff Tunnel**
   First load opens with a cinematic hero where the daily featured match feels like teams walking out under floodlights. It lasts a moment, then the utility layout takes over.

2. **Live Pulse Rail**
   A thin cyan rail travels through the live match strip and highlights active matches. It gives energy without clutter.

3. **Table Race Lens**
   Standings page has a toggle that compresses the league into zones: title, qualification, mid-table, survival. Fans instantly see the stakes.

4. **Match Impact Card**
   On match pages, show what the result changes: table position, qualification, promotion, relegation, group advancement.

5. **Team Color Aura**
   Team pages and match cards use a subtle extracted-color edge from the badge or known club colors. Never flood the UI; just a premium signal.

6. **World Cup Map Moment**
   World Cup pages can use flags and a quiet global grid behind the header, with group tabs that feel like a tournament command center.

## Page-by-Page Blueprint

### Homepage

Order:

1. Global nav and context.
2. Daily Kickoff hero.
3. Live/upcoming match strip.
4. Competition capsules.
5. Today's full match list.
6. Tables snapshot.
7. Featured competition modules.

Main user questions answered:

- What is happening today?
- What is live?
- Where is my competition?
- What are the standings?

### Competition Page

Order:

1. Competition identity header.
2. Category/season/round controls.
3. Matchday carousel.
4. Featured match or next kickoff.
5. Fixtures/results list.
6. Table snapshot.
7. Teams.

Main user questions answered:

- Which competition am I viewing?
- Is this men's or women's?
- Which round/matchday is this?
- What is live/upcoming/finished?
- Where do I go next?

### Match Page

Order:

1. Match scoreboard.
2. Status-specific panel: preview/live/final.
3. Timeline.
4. Stats.
5. Table impact.
6. Related matches.

Main user questions answered:

- What is the score or kickoff?
- Who is playing?
- Where and when?
- What happened?
- What does this result mean?

### Standings Page

Order:

1. Competition/table context.
2. Zone legend.
3. Full responsive league table.
4. Form and movement explanations.
5. Next fixtures affecting zones.

Main user questions answered:

- Who leads?
- Who qualifies?
- Who is in danger?
- Who is in form?

### Team Page

Order:

1. Team identity header.
2. Next match.
3. Recent results.
4. Table position.
5. Squad placeholder.
6. Competition links.

Main user questions answered:

- Who are they playing next?
- How are they doing?
- Where are they in the table?

## Implementation Notes For This Repo

Start from existing components instead of replacing everything at once.

Recommended sequence:

1. Create a global app shell and context bar around `HomeView`.
2. Evolve `LeagueTabs` into the new competition switcher.
3. Split `MatchCard` into ticker/list/hero variants.
4. Expand `StandingsCard` into snapshot and full-table variants.
5. Add route-level pages for competitions, matches, standings, and teams.
6. Add live/loading/empty/error state components.
7. Introduce team-color and competition-accent token helpers.

Current files likely touched first:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/features/home/components/home-view.tsx`
- `src/features/home/components/home-hero.tsx`
- `src/features/home/components/league-tabs.tsx`
- `src/features/matchday/components/match-card.tsx`
- `src/features/standings/components/standings-card.tsx`
- `src/features/world-cup/components/world-cup-panel.tsx`
- `packages/ui/src/components/*`

## Success Criteria

The redesign is successful when:

- A new user knows the current competition, category, round, and match status within three seconds.
- A returning fan can check today's scores in one thumb motion on mobile.
- World Cup, Bundesliga 1, Bundesliga 2, men's, and women's football all feel first-class.
- Tables are easier to read on mobile than a desktop-style squeezed grid.
- Live matches feel alive without noisy motion.
- The UI feels premium and emotional, but the data remains the hero.
