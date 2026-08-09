# OpenLigaDB Caching

Scores have one freshness boundary: the Next.js Data Cache attached to the
OpenLigaDB request.

## Policy

- Matchday and single-match responses revalidate every 30 seconds.
- Static metadata keeps endpoint-specific TTLs: groups and leagues for one day,
  teams for three days, tables for three hours, and season schedules for twelve
  hours.
- Page and overview objects are assembled on demand and are not cached.
- `/api/matchday` is `no-store`; its underlying OpenLigaDB request still uses the
  shared 30-second Data Cache.
- Concurrent identical OpenLigaDB requests are coalesced in-process.
- Retry and `Retry-After` handling protect the provider but never store a stale
  score payload.
- An unfinished match remains refreshable regardless of its age. Polling stops
  only when OpenLigaDB marks it finished.

## Data Flow

```text
Server page ─┐
             ├─ getMatchdaySnapshot ─ 30s Next Data Cache ─ OpenLigaDB
Live client ─┘
```

When OpenLigaDB is healthy, displayed scores are at most 30 seconds behind the
provider. When it fails, the request fails visibly instead of presenting an old
payload as fresh.
