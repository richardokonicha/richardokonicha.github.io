# richardokonicha.github.io

A personal site — a log of things built, studied and noticed, with a résumé
kept on its own page.

Next.js (App Router, statically exported) + Tailwind CSS v4 + TypeScript. Two
shadcn/ui primitives (`Button`, `Card`) rebuilt on this project's tokens, and
hand-written utility classes everywhere else. The page is server-rendered; a
handful of small client islands hold the interaction: the page enhancements, the
pull cord, the player, and the detent drums.

## Develop

```sh
npm install
npm run dev        # http://localhost:3000
```

```sh
npm run build      # static export -> out/
npm run typecheck  # tsc --noEmit, no emit
npm run qa         # headless-Chrome regression suite (see QA)
npm run og         # re-render public/og.png from tools/og.html
```

## Art direction

[`docs/art-direction.md`](docs/art-direction.md) is the short version of why the
site looks like this: two surfaces (cover + dated stream), the type scale, the
colour rules, square corners, and the moving parts (the cord, the deck, the
drums). [`docs/detent.md`](docs/detent.md) reviews every Detent example and
records which ones earned a place.

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
  components/       Cover, Stream, Colophon, Nav, SiteFooter, Wheel,
                    PullCord, Player, SiteBehaviour
    ui/             button.tsx, card.tsx — shadcn primitives on project tokens
  scripts/          plain-DOM progressive enhancement
    behaviour.ts    nav state, reveal-on-scroll, section spy, boots the rest
    pretext.ts      line breaking for display type
    field.ts        the cover's pointer-drawn field
    qa.ts           opt-in layout audit (?qa=1)
  lib/              site.ts (all content), classes.ts (class strings),
                    spring.ts (the shared spring integrator), utils.ts (cn)
  vendor/           vendored Pretext build + hand-written .d.mts
public/
  img/  audio/  og.png   # og.png is the 1200×630 link unfurl
scripts/
  og.mjs            render tools/og.html -> public/og.png
  lib/chrome.mjs    locate a Chrome/Chromium binary
  qa/               the regression suite (see QA)
docs/
  art-direction.md  the rules behind the look
  detent.md         every Detent example, and what earned a place
tools/
  og.html           the link-unfurl card, in paper and ink
```

### Why the client components are small islands

Every page is server-rendered. `SiteBehaviour` holds the progressive
enhancement, written as plain DOM scripts against `data-*` attributes and
imported inside `useEffect` — importing them at module scope would evaluate them
during the static export, where `document` does not exist. The interactive
islands are `PullCord`, `Player` and `Stream`: each owns one interaction and
nothing else. `Wheel` wraps Detent's headless hook; `Stream` filters the log.

The trade-off is deliberate: React hydrates the page, but the markup you read in
`src/components` is the markup that ships.

## Adding things

Almost everything lives in `src/lib/site.ts`.

**A new log entry** — append to `log` (anywhere; `entries` sorts it):

```ts
{
  date: "2026",                // ISO "2026" or "2026-03"; a span uses `since`
  since: "2024",               // optional, for "2024–26"
  kind: "note",                // "work" | "note"
  title: "Something I noticed",
  summary: "One or two sentences.",
  href: "https://…",           // optional; omit for entries that live only here
}
```

The stream sorts on `date` at module load, so it cannot drift out of order.
Keep the granularity honest: a year when it was a year, a month when you know the
month.

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
- **Detent** — the log's year filter and the player's rolling labels use
  `@hayderkg/detent` (headless `useDetent`, `DetentText`, `DetentNumber`). The
  wheels wear this project's tokens, sleep at rest and jump under reduced motion.
  The example-by-example review is in [`docs/detent.md`](docs/detent.md).
- **The cover's field** — one canvas, `pointer-events: none`, painted from the
  live `--color-ink` token. A hairline sine sits at its foot; the pointer leaves a
  particle wake in the open lower half. It spends a fixed budget of particle life
  and then stops, so a resting cover runs zero animation frames. Above the
  field's midline the pointer is ignored — that band is the nav, the cord and the
  name.
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
  anywhere (the position is remembered), set the level on the rail under the
  transport or mute from the header — both are remembered. The engine is ported
  from Kokonut UI's `liquid-glass-card` (MIT), with the simulated clock replaced
  by the real `<audio>` element.
- **Corners** — everything is square with 1px rules, the player included. The
  one round thing on the site is the record itself.

### Placeholder audio

`public/audio/lofi-001.mp3` and `lofi-002.mp3` are stand-ins. Replace them with
properly licensed tracks (and update the `artist` fields in `src/lib/site.ts`)
before publishing.

### Link unfurl

`public/og.png` is a 1200×630 card rendered from `tools/og.html` — the same paper
and ink as the page. After a token change, `npm run og` and commit the result.

## QA

```sh
npm run qa                 # build if out/ is missing, then run everything
npm run qa -- --build      # force a rebuild first
npm run qa -- keys         # one suite: layout | contrast | motion | keys
```

Node builtins only: `scripts/qa/lib.mjs` serves `out/` (with HTTP Range, which the
player needs to seek), launches headless Chrome and drives it over the DevTools
protocol. Nothing to install, no Playwright.

| suite | what it holds down |
| --- | --- |
| `layout` | no horizontal overflow at 1440/1280/768/390, reveals firing, cord and player on screen and not overlapping, the year drum on screen, the cover's field painting a wake and taking no pointer, the cord flipping the theme, the body following, reduced motion leaving the disc and the field still, the phone nav opening and closing |
| `contrast` | WCAG AA on **every** rendered text node, in both themes, on `/` and `/cv/` — the audit walks the DOM, so a restructure cannot silently turn it into a no-op |
| `motion` | the idle tug never changes the theme in 16 s, a real pull still does, and every `requestAnimationFrame` loop (the cord's and the cover field's) returns to zero |
| `keys` | the seek and volume sliders by keyboard, `End`/`Home`, the year drum filtering 7 → 3 and *Show all* restoring it, the tab order reaching the cord and the transport, and the scroll spy setting *and clearing* |

Headless Chrome reports `prefers-reduced-motion: reduce` unless told otherwise, so
every suite sets the media feature explicitly.

The in-page audit is still there for a quick look — open the page with `?qa=1` and
read the hidden `<pre id="qa-output">`:

```js
JSON.parse(document.getElementById("qa-output").textContent)
```

Two things to know when reading it: images are `loading="lazy"`, so anything
below the fold reads as not loaded until you scroll; and seeking only works
against a server that honours Range, which `python3 -m http.server` does not.

Verified at 1440, 1280, 768 and 390 px wide, in Chrome with and without
`prefers-reduced-motion`, in both themes: no horizontal overflow, no console
errors, every reveal firing, the cord's idle tug leaving the theme alone, the
player playing, seeking, scrubbing and switching tracks, the cover's field waking
for the pointer and sleeping again, and the nav opening and closing on a phone.