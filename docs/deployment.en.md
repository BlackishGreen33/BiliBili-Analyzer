# Deployment

> Bilingual: [繁體中文](./deployment.md) · [English](./deployment.en.md)

## Web (Vercel)

### Trigger

- Push to `main`
- `.github/workflows/build.yml` runs `pnpm build` to validate
- On pass, Vercel auto-deploys preview → production

### Environment variables

**None needed.** All APIs are public.

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
3. **Stashes** `src/app/api/` → `src/app/_api_disabled_for_mobile_build/`
   (`output: "export"` does not allow any dynamic route handler; the
   Capacitor shell talks to `bilibili-analyzer.vercel.app` live APIs at
   runtime, so the API routes don't need to be in the static export)
4. Runs `npx next build` (static export to `out/`)
5. `npx cap sync android ios` (copies `out/` into native shells)
6. **Restores** `src/app/api/` and `next.config.mjs`

> The stash / restore happen inside `try / finally`, so even a
> mid-build failure leaves the working tree clean.

### Layout cookie reads

`src/app/layout.tsx` no longer reads `cookies()` server-side. It now
renders defaults (`zh-CN` / `#FB7299`) and lets the client component
`src/common/components/HtmlAttrs.tsx` sync `<html lang>` and
`--accent-color` from `document.cookie` after hydration. The layout
becomes fully static, which `output: "export"` requires. Trade-off:
users with a custom accent color see a brief flash on first paint
(ThemeStore re-derives the color on mount).

### Building native apps

```bash
# Android
npx cap open android    # build APK / AAB in Android Studio

# iOS
npx cap open ios         # archive in Xcode
```

Or push a `v*.*.*` tag and let `.github/workflows/release.yml` build
the Android APK/AAB + Chrome extension zip and create the GitHub
Release automatically. iOS Ad Hoc IPA is still built locally and
uploaded via `gh release upload`.

### Version sync

| File                                    | Field                                           |
| --------------------------------------- | ----------------------------------------------- |
| `package.json`                          | `version`                                       |
| `android/app/build.gradle`              | `versionCode` / `versionName`                   |
| `ios/App/App.xcodeproj/project.pbxproj` | `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` |
| `extension/manifest.json`               | `version`                                       |

Keep all four in lockstep before tagging a release.

### Requirements

- Android: Android Studio + JDK 17 + Android SDK 34
- iOS: macOS + Xcode 15+ + CocoaPods
- Capacitor 8

## Environment variables

None needed.

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
