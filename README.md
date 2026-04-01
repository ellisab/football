# footballleagues

Monorepo layout:

```
apps/
  web/        Next.js app
  mobile/     Expo app
packages/
  ui/         shared components
  core/       shared logic/api client/types
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

# Mobile app: use the web app as a first-party API/logo proxy
EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3000
```

Web (Next.js):
```
pnpm run dev
```

Mobile (Expo):
```
pnpm run dev:mobile
```

Direct commands:
```
pnpm -C apps/web dev
pnpm -C apps/mobile start
```

## EAS build (Android)

Cloud build (recommended):
```
pnpm -C apps/mobile dlx eas-cli build -p android --profile preview --non-interactive
```

Local build (requires Java 17+):
```
pnpm -C apps/mobile dlx eas-cli build -p android --profile preview --local --non-interactive
```
