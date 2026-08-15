# OpenLigaDB Caching

Scores have one freshness boundary: the Next.js Data Cache attached to the
OpenLigaDB request.

## Policy

- Matchday, single-match, and table responses revalidate every 30 seconds.
- Static metadata keeps endpoint-specific TTLs: groups and leagues for one day,
  teams for three days and season schedules for twelve hours.
- Page and overview objects are assembled on demand and are not cached.
- `/api/matchday` is `no-store`; its underlying OpenLigaDB request still uses the
  shared 30-second Data Cache.
- `/api/table` is `no-store`; its underlying OpenLigaDB request also uses the
  shared 30-second Data Cache.
- Concurrent identical OpenLigaDB requests are coalesced in-process.
- Retry and `Retry-After` handling protect the provider but never store a stale
  score payload.
- An unfinished match remains refreshable regardless of its age. Polling stops
  only when OpenLigaDB marks it finished.

## Data Flow

```text
Server page ─────┐
Live scores ─────┼─ snapshot request ─ 30s Next Data Cache ─ OpenLigaDB
Live standings ──┘
```

The live clients check OpenLigaDB every 45 seconds while their tabs are visible,
through the shared 30-second cache. When the provider fails, the last valid
client payload remains visible and is marked as delayed.
