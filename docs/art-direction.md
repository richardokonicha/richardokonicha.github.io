# Art direction

This is a sketchbook, not a portfolio. It exists because Richard enjoys making
it, and the only audience that has to be pleased is the person keeping it.

Everything below is a description of what the code already does, written down so
the next addition does not have to be argued from scratch.

## Two surfaces

**The cover** is fixed. A name, a tagline, a way in. It does not scroll, does
not change with the log, and does not grow. It is the title page of a book, and
the book does not get a new title page every time a page is added.

The cover carries one moving thing: a **field** across its lower half — a
hairline sine and a drift of particles the pointer leaves behind it. It is a
background in the strict sense: `pointer-events: none`, so the name stays
selectable and the links stay clickable; the pointer is read from `window`. It
only draws in the lower half, where the page is empty, and it only wakes for a
hand that actually travels — the nav and the pull cord live above that line and
cannot stir it. It spends a fixed budget of particle life and then stops, so a
resting cover runs zero animation frames.

**The stream** is the book. Dated, newest first, every entry in one continuous
column. Work and notes share the column because they are the same kind of thing
— something that was made, and something that was noticed — and the `kind` label
is the only difference. A separate "projects" grid and a separate "writing" grid
would be a résumé with better typography.

The résumé lives at `/cv/` and is deliberately quiet. It is a document, not a
destination: it answers a question someone already asked.

## What earns a place

An entry is one thing, with a title and one or two sentences. It is not a case
study and it has no metrics. If it needs a paragraph of context to make sense, it
belongs on its own page, not in the stream.

`href` is optional and means "this exists elsewhere". Without it the entry is
only ever a line in the stream, which is fine — most of a log is local.

Dates are ISO (`2026`, `2026-03`) with an optional `since` for a span. The list is
sorted at module load, so the stream cannot drift out of order. Be honest with
the granularity: a year when it was a year, a month when you know the month. Do
not invent a day.

There is no "plates" section. The earlier sketchbook had three studies — a
random walk, a halftone, a Pretext-set quote — presented as if they were works.
They were not: they were demos of techniques, and a demo is not a thing that was
made. The one of them that described the site itself (the particle field) became
the cover's background, where it is a property of the page rather than a
trophy on it. If a study earns a place again it will be because it is a piece,
not because it shows off a shader.

## Type

- **Instrument Serif** for anything that wants to be read.
- **Inter** for running text and interface.
- **Fira Code** for labels, dates, numbers and anything that is a measurement.
- Small caps and letter-spacing are the only emphasis the mono face gets.
- Display headings are line-broken by Pretext so they break where a typesetter
  would put them, not where the browser runs out of room.

The type scale is deliberately narrow: a hero, a section title, an entry title,
body, and a caption. Five sizes, and the clamp() in between is the whole scale.

## Colour

Paper and ink, one accent, one ember. Nothing else. Dark mode is not an inversion
— it is the same room with the lights off, so the same paper goes dim and the
ink goes light. `--color-lamp-*` is deliberately immune to the theme because it
describes a physical object: the lamp's two rooms are always lit and unlit.

A new colour has to justify itself against that, not against the last site.

## Corners

Square, with 1px rules. The record is the one round thing on the site, because
it is the one round thing in the world it depicts. A rounded card would be a
different site.

## Motion

Motion belongs to things that answer a hand: **the pull cord**, **the record
deck**, **the detent drums** — the log's year filter and the player's rolling
labels — and **the cover's field**, which the pointer draws. Every one is a
physical control or a physical surface: it moves while it is being touched,
clicks into place, and sleeps when nothing is happening. Nothing moves to
announce itself, and a control that only decorates is not a control.

Under `prefers-reduced-motion` the cord still answers a real pull, the disc holds
still, the drums jump instead of coasting, the field is a finished drawing instead
of a wake, and the idle tug stops entirely. The site never takes motion away from
someone who asked for stillness — that was the bug the harness caught, and it is
the rule now.

## The rules, in one line each

- The stream is sorted by date, not by authoring order.
- An entry is one thing and two sentences.
- `href` means "elsewhere", not "more".
- Square corners; the record is the exception.
- Paper, ink, one accent, one ember.
- The cover's field is a background: it never takes the pointer.
- Motion is for things that answer a hand, and they sleep at rest.
- Reduced motion is a mode, not a fallback.