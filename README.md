# richardokonicha.github.io

Portfolio and writing site for Richard Okonicha — software engineer and systems
architect in Lagos.

Astro (static output) + Tailwind CSS v4 + TypeScript. No client framework, no
UI kit: the whole thing is semantic HTML, hand-written utility classes, and a
few small islands of TypeScript.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
```

```sh
npm run check      # astro check (types + .astro diagnostics)
npm run build      # -> dist/
npm run preview    # serve the built output
```

## Deploy

Pushes to `main` are built and published by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

One-time setup: **Settings → Pages → Build and deployment → Source → GitHub
Actions**. Until that is switched over, Pages still expects a branch, and the
build output in `dist/` is not published.

## Structure

```
src/
  data/site.ts        all editable content: profile, nav, projects, notes,
                      timeline, facts, social links, player tracks
  layouts/Base.astro  document shell, <head>, fonts, script entry
  pages/index.astro   composes the sections
  components/         Nav, Hero, Work, Experiments, Notes, About, Contact,
                      SiteFooter, Player, Dither, SectionHead
  scripts/            site.ts (reveal, nav, scroll-spy)
                      pretext.ts (line breaking for display type)
                      field.ts (generative particle field)
                      player.ts (lo-fi player)
                      qa.ts (opt-in layout diagnostics, ?qa=1)
  styles/global.css   Tailwind v4 entry: @theme tokens, @layer base, @utility
  styles/classes.ts   shared class-name constants
  vendor/pretext.mjs  vendored Pretext build + hand-written .d.mts
public/
  img/  audio/
```

### Editing content

Almost everything visible lives in `src/data/site.ts`:

- `projects` — Selected work. `year`, `name`, `role`, `summary`, `stack`.
- `notes` — Writing. Omit `href` and the row renders as non-interactive.
- `timeline` — the compact career rail in About.
- `tracks` — lo-fi player. Point `src` at a file in `public/audio/`.

## Design notes

- **Type** — Pretext does the line breaking for display headings, so a headline
  breaks where a typesetter would put it rather than where the browser runs out
  of space. It runs on font load and re-splits on resize. Under
  `prefers-reduced-motion` the split is skipped entirely and the heading renders
  as plain text.
- **Colour** — paper/ink, with a single accent and one ember tone. All of it is
  declared in `@theme` in `src/styles/global.css`, so a token change propagates.
- **Dither** — images are Bayer-dithered by `dither-plugin` at build time, driven
  by the `--dither-cell` and `--dither-contrast` custom properties on
  `[data-dither]`. Sizes are literal classes (`dither-xs` … `dither-2xl`) so the
  plugin can read them statically.
- **Motion** — reveal-on-scroll is opt-in on `.js` (see the `js` custom variant),
  so content is visible with scripting disabled. Everything collapses under
  `prefers-reduced-motion`.
- **Player** — no autoplay, never unmuted without a gesture, volume persisted in
  `localStorage`.

### Placeholder audio

`public/audio/lofi-001.mp3` and `lofi-002.mp3` are stand-ins. Replace them with
properly licensed tracks (and update the `artist` fields in `src/data/site.ts`)
before publishing.

## QA

`npm run build` then open the page with `?qa=1`. The `qa` script appends a
hidden `<pre id="qa-output">` holding a JSON report: horizontal overflow, hero
font size, nav and player rects, dither count and layer, split-heading count,
Pretext state, font status, image load state, and any uncaught errors. Read it
from the console with:

```js
JSON.parse(document.getElementById("qa-output").textContent)
```

Verified at 1440, 1280, 768 and 390 px wide, in Chrome with and without
`prefers-reduced-motion`: no horizontal overflow, no console errors, grids and
nav collapsing at the right breakpoints, Pretext splitting headings, and the
player seeking, switching tracks, and expanding on every viewport.