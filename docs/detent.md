# Detent on this site

[Detent](https://detent.hayder.sh) is a React wheel picker with real inertia and
precise snapping, plus `DetentText` and `DetentNumber` for labels that change.
It is MIT, has no runtime dependencies beyond React, and ships a headless hook
(`useDetent`) for custom markup.

It earns a place here for the same reason the pull cord does: it is a physical
control. You turn it, it coasts, it clicks into a slot, and it stops. The
alternative — a row of buttons — is a menu; a drum is an object.

## Where it is used

| Area | Control | Component | What it changes |
| --- | --- | --- | --- |
| Log header | year drum | `Stream` + `Wheel` | filters the stream; the entry count rolls with `DetentNumber` |
| Player | status + title | `DetentText` | `Ready` / `Playing` / `Paused`, and the track title rolls when it changes |

There were two more drums until the sketchbook section was retired: a speed drum
on the cover's particle field, and a halftone cell on a plate. Both went with the
plates. The field is now a background with no controls at all — it answers the
pointer directly — so the only wheels left are the two above.

`Wheel` is the only wrapper: it calls `useDetent`, spreads the root/track/row
props, and dresses them in this project's tokens. The rows read Detent's live
`--offset` and `--abs-offset` variables in CSS, so React never renders during a
throw. `Wheel` takes a `tone` prop so a drum can sit on paper or in a recess;
with the plates gone, only the `paper` tone is in use.

## The rules we kept

- **Headless, not the styled `<Detent>`.** The iOS glass drum is a different
  site. We keep the physics and draw the square, 1px-band version ourselves.
- **Square, 1px, paper/ink.** The selection marker is a band of hairlines, not a
  rounded pill; the rows use `muted` → `ink`.
- **Motion only while touched.** Every drum sleeps at rest; the QA rAF check
  proves it. Nothing auto-spins to show off.
- **Reduced motion is a mode.** Detent jumps to the row instead of coasting; the
  site still answers the keyboard and still changes value.
- **Accessible by default.** `role="listbox"`, `role="option"`,
  `aria-activedescendant`, a polite live region, and a visible focus ring. The
  contrast suite measures the rows in both themes.
- **One contract per island.** `Stream` holds local state; the plain modules
  stay plain. No globals.

## Every example, reviewed

The examples page is the full menu. This is the decision for each one, so the
next person does not have to re-litigate it.

### Pickers

| Example | Verdict | Why |
| --- | --- | --- |
| iOS time picker | skip | the site has no time input |
| Date picker | skip | dates in the log are content, not an input |
| Time zones | skip | no timezone UI, and a world clock would be a different site |
| Split the bill | skip | no money, no social table |
| Variable font | skip | Instrument Serif is not variable; a type-axis toy would be decoration, and the hero's name is Pretext-set and must stay still |
| Word wheel | skip | would turn the tagline's last word; the tagline is Pretext-set, and a fixed slot wide enough for "unfinished" would gape around "built" — decoration, not a control |
| Dynamic sentence | skip | same problem as the word wheel, plus a number that has nothing to count |
| Weight dial | skip | nothing on the site is measured in weight |
| Token list | skip | the log rows have no prices or sparklines |
| Color wheel | skip | the palette is paper, ink, one accent, one ember; a colour picker would break the rule it would be demonstrating |
| Action wheel | skip | the nav is three quiet links; a fan-out menu would be decoration |
| Image wheel | skip | it was the halftone drum on P·02, and it left with the plates; there is no image to re-screen any more |

### Beyond pickers

| Example | Verdict | Why |
| --- | --- | --- |
| Carousel | skip | the stream is one continuous column; paging it would hide the thing the site is for |
| Stories | skip | no stories |
| Password lock | skip | no locks |
| FM radio | skip | the player is local audio, not stations; a tuning dial would fake a radio that is not there |
| Zoom ring | skip | the cover's field is a background, not a photograph to inspect |
| Arc menu | skip | decoration; the nav already works and is quiet |
| Reaction strip | skip | no reactions |
| Detent Number | **used** | the log's entry count changes with the year filter; the roll is the feedback |
| Detent Text | **used** | the player's status and track title change; the roll makes the change legible |
| Departures board | skip | the log is not a timetable; a split-flap board would be a costume |
| Odometer | skip | the player's time is already a per-digit odometer, hand-tuned; `DetentNumber` rolls through every intermediate digit, so 59 → 00 would spin like a slot machine |
| Slot machine | skip | no chance, no reels |

### Techniques

| Example | Verdict | Why |
| --- | --- | --- |
| Headless | **used** | every wheel on the site |
| Load more | skip | seven entries; there is nothing to page |

### Custom interactions

| Example | Verdict | Why |
| --- | --- | --- |
| Liquid | skip | a WebGL shader would add a second rendering stack to a site that is deliberately flat |
| Dust | skip | the cover's field is already a particle drift; a second canvas with a different physics would be a second subject on the same page |
| Riso | skip | there is no print study any more; a misregistration shader would be a second print mode with nothing to misregister |

## What we deliberately did not do

The cover is the obvious place to put a word wheel, and it is the one we left
alone. Two reasons:

1. **Pretext.** The name and tagline are measured and split into masked lines. A
   wheel inside them would be flattened to text by the splitter, and a fixed-width
   slot would have to be wide enough for the longest word, leaving a visible gap
   around the short ones.
2. **It would be decoration.** The log's year filter changes the stream. A word
   that turns in the tagline changes only the tagline. The art direction is
   explicit: a control that only decorates is not a control.

The other thing we left alone is the field itself. It could have had a speed
drum, a density dial, a colour picker — and did, when it was a plate. As a
background it takes none of them: it is a surface the page happens to have, not
an instrument, and a background with a control panel is a toy.

## Verification

```sh
npm run typecheck
npm run build
npm run qa -- --build
```

The suite holds down:

- **layout** — the year drum is on screen at 1440/1280/768/390 with no
  horizontal overflow; the cover's field paints a wake under a pointer sweep,
  takes no pointer itself, and is a finished drawing under reduced motion;
- **keys** — the year drum filters 7 → 3 and *Show all* restores 7;
- **contrast** — every rendered text node in both themes on `/` and `/cv/`
  (76 and 59 nodes), 0 below AA;
- **motion** — the idle rAF check still sees zero callbacks, a pointer sweep
  wakes the field and the field sleeps again, and reduced motion jumps instead
  of coasting.