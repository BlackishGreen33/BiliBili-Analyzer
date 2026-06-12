# Product

> Strategic counterpart to `DESIGN.md`. All design decisions in this project
> trace back to the answers below.

## Register

product

## Users

- **Primary**: data-curious B 站 (Bilibili) viewers — typically content
  creators, MCN/agency operators, marketing analysts, and researchers —
  who want a quick, _non-algorithmic_ read on "what is trending on B 站
  right now" beyond what the official homepage surfaces. They don't want
  a video player; they want a dashboard.
- **Secondary**: casual users who already know the homepage is curated,
  and want to see raw popularity by channel, by UP 主, by hour-of-day.
- **Tertiary**: the project author (academic context, B 站 analytics
  course assignment), who uses it as a personal data tool.

Context of use: opened 1–3 times per day on desktop during work hours;
occasionally on mobile via the Capacitor shell. Sessions are short
(2–10 min) but high information density — the user wants to _scan_, not
_explore_.

## Product purpose

A read-only, day-aggregated B 站 popular-videos **observatory** that
re-crawls the public top-1000 daily, joins it with UP 主 metadata, and
answers three questions fast:

1. _What is hot right now?_ (per-day list, by date)
2. _What is hot **across** categories / UP 主 / time-of-day?_ (dashboard)
3. _What is this single video's engagement signature?_ (detail page)

We are **not** building a B 站 client. We are not building a video
player. We are not building a recommendation engine. We are building a
**single-screen B 站 analytics tool** that respects Bilibili's public
data and stores nothing personal.

Success looks like:

- a returning user can pick a date, see the day's top 20 UPs, the
  distribution of channels, and the "weird tags" (e.g. unexpected
  collaboration events) — all in under 30 seconds
- the data layer is cheap enough to run on Vercel's free tier and a
  daily GitHub Actions cron
- the codebase can be read top-to-bottom by a student in 30 min

## Brand personality

**Voice**: 冷靜 / 觀測者 (calm / observatory). We report. We do not hype.

3-word personality: `cold`, `precise`, `honest`.

Tone is the opposite of Bilibili's own marketing voice — which is
playful, pink, "wow! new episode!". We are the equivalent of Bloomberg
Terminal for a B 站 slice. Capital-T **Tone**:

- No emoji in copy (except the brand mark).
- Numbers are written with thousands separators and units, never
  unformatted integers.
- "Hot" and "trending" are off-limits in copy unless they describe a
  derived metric (e.g. "互动率 = (like + 2·coin + 2·favorite + share) /
  view").
- "Favorite" tag (收藏) is treated as a 2x-weighted signal because it
  is an explicit "save for later" intent, stronger than a like.

## Anti-references

Explicitly **not**:

- **bilibili.com itself** — no comment sections, no login, no B 站
  navigation chrome. The user is here to _observe_, not consume.
- **notion.so / linear.app / vercel.com** — we are not a SaaS product
  pitch. No gradient text, no big "Get started" hero, no 3-up feature
  cards.
- **stripe.com / linear marketing pages** — no animated SVG diagrams of
  how our app works.
- **the previous version of this project** — which was an antd +
  Syncfusion admin shell with Chatbase iframe injection, unused
  components, and a hard-coded `aid=347243364` in the video iframe.
  The new version is the _anti-portrait_ of that.
- **any "AI dashboard" template** — no hero-metric tiles as the
  landing, no agent chatbot, no purple-to-blue gradient.

## Design principles

1. **Show data, not chrome.** Every page above the fold is data. The
   first thing the user sees is the day's count, the last crawl time,
   and the video list. There is no marketing copy between them.
2. **One accent, ≤ 8 %.** The B 站 pink is a _dot of identity_, not a
   theme. Body text, cards, borders are neutral. The pink exists so
   the project reads as "B 站" and not as "any analytics tool".
3. **Numbers, not adjectives.** "119.6 万" beats "very popular". "12.4 %
   engagement" beats "high engagement". The data is allowed to be the
   voice.
4. **Server-light, client-thick.** All data fetching goes through SWR
   hooks; components are presentational; the API layer is 5 thin
   server functions. The UI never blocks on a backend write.
5. **Respect Bilibili.** We do not scrape user-specific endpoints, do
   not store user data, do not call any authed API. The crawler
   fetches public, anonymous top-100 data only. Every page has a
   footer disclaimer.
6. **Errors as features.** Empty states, loading skeletons, retry
   buttons, and accessible error messages are first-class — not an
   afterthought. `VideoInfo` shows `<Spinner>` then either the
   content or a `没有匹配的视频` empty-state.
7. **One source of truth for shared data.** A `STAT_METRICS` constant
   in `Analization.tsx` powers both the 7-card grid and the
   `StackedChart`. If we add a metric, we add it once. (Old code
   duplicated the list — 7 cards, 7 chart bars, two places to
   update.)

## Accessibility & inclusion

- Target: **WCAG 2.2 AA**.
- Body text contrast: ≥ 4.5:1 against surface (zinc-50 / zinc-950).
- Muted text: kept at zinc-500, also ≥ 4.5:1.
- Focus rings: not removed.
- Hit targets: ≥ 36 px.
- Motion: `prefers-reduced-motion` short-circuits animations to
  instantaneous.
- **Locales (v0.3+)**: 简体中文 (zh-CN, default) / 繁體中文 (zh-TW) / English。
  切換器在「設置中心」drawer；持久化 cookie + localStorage。
  CJK-friendly fonts: Noto Sans SC as primary, PingFang SC as macOS fallback,
  Microsoft YaHei as Windows fallback。
- No audio plays automatically. Video embeds require user click to
  start (`autoplay=false` on the B 站 iframe).
- All interactive controls have visible labels (text + icon, or
  `aria-label` for icon-only).
- Color is never the only signal: error states use both red _and_ an
  icon; "selected filter" uses both pill-color _and_ weight.
- `<html lang>` server 端跟 cookie 同步：切換語言後 reload 也不閃。
  副作用：所有頁面從 static 變 dynamic（見 `docs/architecture.md` 已知限制）。
