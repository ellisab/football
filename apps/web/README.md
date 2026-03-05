# Web App

The web app is the Next.js 16 App Router client for the football monorepo.

## Commands

Run these from the repository root:

```bash
pnpm dev
pnpm build:web
pnpm lint:web
pnpm typecheck:web
```

## Structure

```text
src/
  app/
    (home)/
      page.tsx
      loading.tsx
      error.tsx
    layout.tsx
  features/
    home/
      components/
      server/
    champions-league/
    matchday/
    standings/
    teams/
```

## Boundaries

- `src/app` only contains route files and the root layout.
- `src/features/home` owns page composition and Next-specific data loading.
- Domain UI stays inside its own feature folder.
- Shared football rules and aggregation live in `packages/core`.
- Shared UI primitives live in `packages/ui`.

## Data Flow

The home route calls `getHomePageData`, which wraps the shared `@footballleagues/core/home` snapshot service with Next.js revalidation options. Route components stay thin, while the feature layer renders the resolved home snapshot.
