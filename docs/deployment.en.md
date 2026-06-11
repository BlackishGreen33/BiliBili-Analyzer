# Deployment

> Bilingual: [繁體中文](./deployment.md) · [English](./deployment.en.md)

## Web (Vercel)

### Trigger

- Push to `main`
- `.github/workflows/build.yml` runs `pnpm build` to validate
- On pass, Vercel auto-deploys preview → production

### Environment variables

None. All APIs are public.

> The old version required `SYNCFUSION_LICENSE`, which has been
> removed.

### Build

```bash
pnpm build
```

### Vercel config

- **Framework**: Next.js
- **Build command**: `pnpm build`
- **Output dir**: `.next`
- **Node.js**: 20

> **Do NOT enable** `output: "export"`! It breaks API routes and
> disables dashboard + detail.

## Data crawl (GitHub Actions)

`.github/workflows/crawl.yml`:

```yaml
on:
  schedule:
    - cron: '0 4 * * *' # 12:00 UTC+8
  push:
    branches: [main]
  workflow_dispatch:
```

### Flow

1. checkout `main`
2. `pnpm install`
3. `pnpm run crawldata` (runs `CrawlPopular.cjs`)
4. copy `result/` to `/tmp`
5. switch to `result` orphan branch
6. apply `/tmp` back into `result/`
7. `git add result/* -f && git commit && git push origin result`

### Failure handling

- If the cron fails, that day has no data; SWR falls back to yesterday.
- `result` branch history is unbounded.
- Monitoring: enable GitHub Issues alerts.

## Mobile (Capacitor)

### Why not enabled by default?

`next.config.mjs` keeps `// output: "export"` commented out, because
Vercel build fails with it enabled (API routes + middleware don't
export).

### Build flow

```bash
pnpm build:mobile
```

This:

1. Backs up `next.config.mjs` to `next.config.mjs.bak`
2. Uncomments `output: "export"`
3. Runs `npx next build` (static export to `out/`)
4. `npx cap sync android ios` (copies `out/` into native shells)
5. **Restores** `next.config.mjs`, deletes `.bak`

### Building native apps

```bash
# Android
npx cap open android    # build APK / AAB in Android Studio

# iOS
npx cap open ios         # archive in Xcode
```

### Requirements

- Android: Android Studio + JDK 17 + Android SDK
- iOS: macOS + Xcode 15+ + CocoaPods
- Capacitor 8

## Environment variables

| Name                 | Purpose   | Required |
| -------------------- | --------- | -------- |
| `SYNCFUSION_LICENSE` | (removed) | ❌       |
| `NEXT_PUBLIC_*`      | (none)    | ❌       |

## Monitoring

Not yet integrated. To add Sentry:

```bash
pnpm add @sentry/nextjs
```

Then enable it in `next.config.mjs` and wire Sentry.capture calls in
`src/app/error.tsx` and the API route `console.error`s.

## Rollback

- Vercel dashboard → Deployments → previous prod deployment → Promote
- `result` branch: `git revert` or `git reset --hard <good-sha>`

## CDN / cache

Vercel provides:

- Static assets: immutable cache
- Pages: SWR mechanism
- API routes: no HTTP cache (in-memory cache inside the route)

## Analytics

Not yet integrated. Future: Plausible / Umami.
