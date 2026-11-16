# richardokonicha.github.io

A personal site — a log of things built, studied and noticed, with a résumé
kept on its own page.

Next.js (App Router, statically exported) + Tailwind CSS v4 + TypeScript. Two
shadcn/ui primitives (`Button`, `Card`) rebuilt on this project's tokens, and
hand-written utility classes everywhere else. Three small client components hold
all of the behaviour: the page enhancements, the pull cord and the player.

## Develop

```sh
npm install
npm run dev        # http://localhost:3000
```

```sh
npm run build      # static export -> out/
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
without it `/cv/` would 404.

## Structure

```
src/
  app/
    layout.tsx      document shell, fonts, metadata, scripts
    globals.css     Tailwind v4 entry: @theme tokens, @layer base, @utility
    page.tsx        the log
    cv/page.tsx     the résumé
  components/       Cover, Stream, Plates, Colophon, Nav, SiteFooter, Dither,
                    PullCord, Player, SiteBehaviour
    ui/             button.tsx, card.tsx — shadcn primitives on project tokens
  scripts/          plain-DOM progressive enhancement
    behaviour.ts    nav state, reveal-on-scroll, section spy, boots the rest
    pretext.ts      line breaking for display type
    field.ts        generative particle field
    qa.ts           opt-in layout audit (?qa=1)
  lib/              site.ts (all content), classes.ts (class strings),
                    spring.ts (the shared spring integrator), utils.ts (cn)
  vendor/           vendored Pretext build + hand-written .d.mts
public/
  img/  audio/
```

### Why there are only three client components

Every other component is a server component. `SiteBehaviour` holds the
progressive enhancement, written as plain DOM scripts against `data-*` attributes
and imported inside `useEffect` — importing them at module scope would evaluate
them during the static export, where `document` does not exist. `PullCord` and
`Player` are the two pieces that are genuinely interactive: each is a ref, a
`requestAnimationFrame` loop and some pointer handlers.

The trade-off is deliberate: React hydrates the page, but the markup you read in
`src/components` is the markup that ships.

## Adding things

Almost everything lives in `src/lib/site.ts`.

**A new log entry** — append to `entries`, newest first:

```ts
{
  date: "2026",
  kind: "note",              // "work" | "note"
  title: "Something I noticed",
  summary: "One or two sentences.",
  href: "https://…",         // optional; omit for entries that live only here
}
```

**A new plate** — append to `plates`. Three shapes, each rendering differently:

```ts
{ kind: "field", no: "P·04", title: "…", caption: "…", formula: ["x = …"] }
{ kind: "image", no: "P·05", title: "…", caption: "…", src: "/img/x.svg", alt: "…" }
{ kind: "type",  no: "P·06", title: "…", caption: "…", quote: "…" }
```

**The résumé** — `roles`, `cvFacts` and the contact details, all in the same
file. The home page and `/cv/` read from different fields on purpose: the log
gets a title and a sentence, the résumé gets the rest.

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
- **Pull cord** — the theme switch is a lamp on a wire in the top-right corner.
  The cord is a chain of twelve weighted points, so it hangs, swings and whips;
  pull past the click and the light floods the little room and the page follows.
  It gives the occasional unheld tug to show it can be pulled, but that tug
  always stops short of the click: **only a real pull — pointer, touch or
  keyboard — ever changes the theme.**
- **Player** — a record deck in the lower-left corner. No autoplay: the disc
  only turns at 33⅓ once you press play. Spin the record to scrub, drag the card
  anywhere (the position is remembered), mute from the header. The engine is
  ported from Kokonut UI's `liquid-glass-card` (MIT), with the simulated clock
  replaced by the real `<audio>` element.
- **Corners** — everything is square with 1px rules, the player included. The
  one round thing on the site is the record itself.

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

Note that seeking in the player only works against a server that honours HTTP
Range requests. `python3 -m http.server` does not, so the seek bar will appear
dead when testing that way; GitHub Pages and any Node static server do.

Verified at 1440, 1280, 768 and 390 px wide, in Chrome with and without
`prefers-reduced-motion`, in both themes: no horizontal overflow, no console
errors, every reveal firing, the cord's idle tug leaving the theme alone, the
player playing, seeking, scrubbing and switching tracks, and the nav opening and
closing on a phone.