# Broadcaster rules

This module does not query or scrape a broadcaster, league, or EPG service.
It derives live German coverage from the published 2025/26–2028/29 rights
packages and the match slot already supplied by OpenLigaDB.

Automatic rules cover Bundesliga and 2. Bundesliga seasons starting in 2025
through 2028. They distinguish individual matches from conferences and free TV
from subscriptions.

Champions League coverage is supported through the 2026/27 season. OpenLigaDB
does not identify Prime Video's exclusive Tuesday selection, so Tuesday
fixtures show both DAZN and Prime Video until an official assignment is added
as a manual override. The other Champions League match days resolve to DAZN.
Later rights cycles fail closed until their German packages are modelled.
Highlight programmes and delayed replays are outside this module.

## Manual overrides

`data/manual-overrides.json` is the editorial escape hatch for:

- the exact RTL or NITRO assignment;
- the two special SAT.1 winter Friday matches;
- rescheduled fixtures and other published exceptions.
- the exact Champions League match selected by Prime Video on Tuesday.

An override fully replaces the inferred list. It is keyed by the canonical
league and OpenLigaDB match ID, then guarded by kickoff, season, and team IDs so
stale data fails closed.

```json
[
  {
    "matchKey": "bl2:12345",
    "competitionId": "bl2",
    "matchId": 12345,
    "season": 2026,
    "kickoffUtc": "2026-08-08T18:30:00Z",
    "homeTeamId": 1,
    "awayTeamId": 2,
    "broadcasters": [
      { "broadcasterId": "rtl", "coverage": "individual" },
      { "broadcasterId": "sky", "coverage": "individual" },
      { "broadcasterId": "wow", "coverage": "individual" }
    ],
    "sourceUrl": "https://www.rtl.de/...",
    "verifiedAt": "2026-08-01T10:00:00Z",
    "note": "Exact free-TV channel confirmed by RTL"
  }
]
```

Only use an official competition or broadcaster announcement as `sourceUrl`.
Run the core tests after every edit. Broadcaster marks in the web UI are
code-native text treatments, not copied logo files.
