# richardokonicha.github.io

Portfolio and sketchbook of Richard Okonicha — engineer and writer.

Next.js (App Router, statically exported) + Tailwind CSS v4 + TypeScript. No UI
kit and no component library: semantic markup, hand-written utility classes, and
one small client component that holds all of the progressive enhancement.

## Develop

```sh
npm install
npm run dev        # http://localhost:3000
```

```sh
npm run build      # static export -> out/
npm run start      # serve the export locally (not needed day to day)
```

## Deploy

Pushes to `main` are built and published by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which uploads the
`out/` directory produced by `next build`.

One-time setup: **Settings → Pages → Build and deployment → Source → GitHub
Actions**. Until that is switched over, Pages still expects a branch and nothing
is published.

`next.config.mjs` sets `output: "export"` and `trailingSlash: true`. The trailing
slash is not cosmetic: Pages only resolves a directory to its `index.html`, so
without it every route except `/` would 404.

## Structure

```
src/
  app/
    layout.tsx      document shell, fonts, metadata, scripts
    globals.css     Tailwind v4 entry: @theme tokens, @layer base, @utility
    page.tsx        composes the sections
  components/       Nav, Hero, Work, Experiments, Notes, About, Contact,
                    SiteFooter, Player, Dither, SectionHead, SiteBehaviour
  scripts/          plain-DOM progressive enhancement
    behaviour.ts    nav state, reveal-on-scroll, section spy, boots the rest
    pretext.ts      line breaking for display type
    field.ts        generative particle field
    player.ts       lo-fi player
    qa.ts           opt-in layout audit (?qa=1)
  lib/              site.ts (all editable content), classes.ts (class strings)
  vendor/           vendored Pretext build + hand-written .d.mts
public/
  img/  audio/
```

### Why there is only one client component

Every component except `SiteBehaviour` is a server component. All the
interactivity is written as plain DOM scripts against `data-*` attributes, so it
lives in one `"use client"` component that imports them inside `useEffect`.
Importing them at module scope would evaluate them during the static export,
where `document` does not exist.

The trade-off is deliberate: React hydrates the page, but the markup you read in
`src/components` is the markup that ships.

### Editing content

Almost everything visible lives in `src/lib/site.ts`:

- `projects` — selected work. `year`, `name`, `role`, `summary`, `stack`.
- `notes` — writing. Omit `href` and the row renders as non-interactive.
- `timeline` — the compact career rail in About.
- `facts` — the definition list under the timeline.
- `tracks` — lo-fi player. Point `src` at a file in `public/audio/`.

## Design notes

- **Type** — Pretext does the line breaking for display headings, so a headline
  breaks where a typesetter would put it rather than where the browser runs out
  of space. It runs on font load and re-splits on resize. Under
  `prefers-reduced-motion` the split is skipped entirely and the heading renders
  as plain text.
- **Fonts** — Instrument Serif, Inter and Fira Code are self-hosted through
  `next/font`, exposed as CSS variables and referenced from `@theme`. No
  third-party font request leaves the page.
- **Colour** — paper/ink, with a single accent and one ember tone. All of it is
  declared in `@theme` in `src/app/globals.css`, so a token change propagates.
- **Dither** — images are Bayer-dithered by `dither-plugin`, driven by the
  `--dither-cell` and `--dither-contrast` custom properties on `[data-dither]`.
  Sizes are literal classes (`dither-xs` … `dither-2xl`) so the plugin can read
  them statically.
- **Motion** — reveal-on-scroll is opt-in on `.js` (see the `js` custom variant),
  so content is visible with scripting disabled. Everything collapses under
  `prefers-reduced-motion`.
- **Player** — no autoplay, never unmuted without a gesture, volume persisted in
  `localStorage`.

### Placeholder audio

`public/audio/lofi-001.mp3` and `lofi-002.mp3` are stand-ins. Replace them with
properly licensed tracks (and update the `artist` fields in
`src/lib/site.ts`) before publishing.

## QA

`npm run build`, serve `out/`, then open the page with `?qa=1`. The `qa` script
appends a hidden `<pre id="qa-output">` holding a JSON report: horizontal
overflow, hero font size, nav and player rects, dither count and layer,
split-heading count, Pretext state, font status, image load state, and any
uncaught errors. Read it with:

```js
JSON.parse(document.getElementById("qa-output").textContent)
```

Verified at 1440, 1280, 768 and 390 px wide, in Chrome with and without
`prefers-reduced-motion`: no horizontal overflow, no console errors, grids and
nav collapsing at the right breakpoints, Pretext splitting headings, and the
player seeking, switching tracks, and expanding on every viewport.