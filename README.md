# footballleagues

Single app repo layout:

```text
src/
  app/        Next.js App Router
  features/   domain UI and server helpers
public/       static assets
packages/
  ui/         shared UI primitives
  core/       shared football logic/api client/types
```

## Quick start

Install dependencies:
```
pnpm install
```

Optional environment variables:
```
# Web canonical metadata / sitemap host
SITE_URL=http://localhost:3000
```

Web (Next.js):
```
pnpm run dev
```

Common checks:
```
pnpm run build
pnpm run lint
pnpm run typecheck
```

## Documentation

- [Product and visual specification](docs/definitive-football-product-redesign.md)
- [OpenLigaDB caching, polling, and backoff](docs/openligadb-caching-plan.md)
