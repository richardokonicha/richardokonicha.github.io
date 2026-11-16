import { reducedMotion } from "@/lib/spring";

/**
 * The cover's field.
 *
 * A random walk that never repeats itself, drawn behind the name.
 *
 * The walk is **chaotic, not random**. P·01 used `Math.random()`, which is
 * unreproducible but not mathematics — it is noise wearing a formula. This
 * integrates the logistic map instead:
 *
 *     x ← r·x·(1 − x),  r ≈ 3.99
 *
 * which is deterministic (a seed always yields the same path) and chaotic
 * (nearby seeds diverge exponentially, so the path never repeats and cannot be
 * predicted without the seed). The seed is mixed from the clock and the
 * pointer, so no two visits draw the same cloud.
 *
 * Three costs are kept down:
 *
 *  - **No idle loop.** The cover is a title page. A pointer sweep wakes the
 *    walk, each frame spends one unit of a fixed budget, and the loop stops
 *    when the budget, the walkers and the cloud are all spent. A resting page
 *    runs zero frames — the QA motion suite asserts it.
 *  - **No layout reads.** The canvas is a background: `pointer-events: none`,
 *    so the pointer comes from `window` and the copy stays selectable. Size
 *    comes from a `ResizeObserver` and `devicePixelRatio`, never from scroll.
 *  - **No theme constants.** The ink is read from the live `--color-ink` token
 *    and re-read when `data-theme` flips, so a swap repaints instead of
 *    leaving a ghost of the old colour.
 *
 * The cloud is a **trail of timed segments**, not an accumulation buffer. An
 * accumulating canvas has to be faded with `destination-out`, and an 8-bit
 * alpha channel stalls: a pixel at alpha 40 multiplied by 0.993 rounds back to
 * 40 and never fades, so every sweep would leave a permanent stain. Keeping the
 * segments and re-stroking them at an age-derived alpha fades exactly, costs
 * six strokes a frame, and empties completely.
 */

/** Control parameter: 3.99 is fully chaotic (the map never settles). */
const R = 3.99;

/** One unit of budget is one 60 Hz frame of walking. */
const BUDGET_MAX = 9;
/** Budget per pixel of deliberate travel beyond the jitter threshold. */
const PER_PX = 0.09;
/** Travel below this is jitter (the cord's idle tug shifts the page a few px).
    Ignoring it keeps the field asleep unless a hand really moved. */
const MIN_TRAVEL = 16;
/** A sweep must travel this far before the walk wakes at all, so a cursor
    resting under a gently swinging cord never starts it. */
const ARM_TRAVEL = 120;
/** Travel is capped per event so a teleporting cursor cannot flood the field. */
const MAX_TRAVEL = 160;

/** Walkers alive at once. */
const MAX_WALKERS = 5;
/** Steps integrated per frame, per walker — the walk's speed. */
const STEPS = 7;
/** Step length in px; the walk's stride. */
const STRIDE = 5.5;
/** The chaotic state is nudged toward the pointer, so the walk heads where
    the hand went instead of wandering off. 0 = pure walk, 1 = pure homing. */
const STEER = 0.06;

/** A segment fades out over this long, then is dropped. Four seconds is long
    enough to watch the cloud evaporate and short enough that the loop sleeps
    again without the visitor noticing it stop. */
const FADE_MS = 4000;
/** The fade is quantised into this many alpha steps, one stroke each. Six is
    invisible as banding and keeps the frame to six strokes. */
const BUCKETS = 6;
/** Alpha of the newest segments. */
const CLOUD_ALPHA = 0.5;
/** The reduced-motion still frame is drawn at this fraction of that. */
const STILL_STRENGTH = 0.4;

/** Where the walk's still line rides, as a fraction of the cover's height. */
const BASELINE = 0.9;
/** The walk's band: the open lower part of the cover. It bounces off both
    edges, so a cloud can never drift up under the name. */
const FIELD_BOTTOM = 0.94;
/** Pointer travel above this line is reading, not drawing, and is ignored.
    The nav and the pull cord live in that band, so their motion cannot wake
    the field — only a hand in the open lower half can. */
const POINTER_TOP = 0.48;
/** How much of the pointer's recent path keeps re-seeding the walk, and for
    how long. This is what turns a dot into a trail. */
const TRACE_MS = 170;
const TRACE_POINTS = 12;

interface Walker {
  /** Position in CSS px. */
  x: number;
  y: number;
  /** Logistic state in (0, 1). */
  u: number;
  /** Heading, so the step has a direction as well as a distance. */
  angle: number;
  /** Frames lived, against `life`. */
  age: number;
  life: number;
}

/** One frame's worth of walk, flat as [x1, y1, x2, y2, …] in CSS px. */
interface Trail {
  at: number;
  segs: number[];
}

/** Deterministic hash — the still frame is identical on every visit. */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43_758.5453;
  return s - Math.floor(s);
}

/** `#rrggbb` → `"r, g, b"`, with a fallback for an unexpected token value. */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return "20, 17, 14";
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** One logistic step. `u` stays in (0, 1) for r = 3.99. */
function next(u: number) {
  return R * u * (1 - u);
}

export function initField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = ctx;

  const still = reducedMotion();
  const host = canvas.parentElement ?? canvas;

  let width = 1;
  let height = 1;

  let walkers: Walker[] = [];
  /** Recent pointer positions, so the walk keeps heading where the hand went. */
  const trace: { x: number; y: number; at: number }[] = [];
  /** The cloud: one entry per frame that drew, oldest first. */
  let trail: Trail[] = [];

  let raf = 0;
  let last = 0;
  let time = 0;
  let inView = true;

  let budget = 0;
  /** 0 until the pointer has travelled far enough to count as a hand. */
  let armed = 0;
  let charge = 0;
  let hasPointer = false;
  let px = 0;
  let py = 0;

  /* The chaotic seed. Anything that differs between visits will do: the clock
     alone is enough, and mixing in the first pointer position means a reload
     and a return draw different clouds even within the same millisecond. */
  let seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;

  /* The ink and the rule's strength, both from live tokens. */
  let inkRgb = "20, 17, 14";
  let ruleAlpha = 0.14;

  /* ---- the cloud buffer ---------------------------------------------- *
   * Half resolution: the cloud is a wash, so the extra pixels buy nothing
   * and cost a quarter of the fill. Segments are stored in CSS px and scaled
   * once, here.
   * -------------------------------------------------------------------- */

  const cloud = document.createElement("canvas");
  const cc = cloud.getContext("2d");

  const readPalette = () => {
    const s = getComputedStyle(document.documentElement);
    inkRgb = hexToRgb(s.getPropertyValue("--color-ink").trim() || "#14110e");
    /* A dark room needs a slightly stronger rule to read at all. */
    ruleAlpha = document.documentElement.dataset.theme === "dark" ? 0.22 : 0.14;
  };

  /** Bottom edge of the hero name in CSS px, cached on resize so font loading
    shifts don't move the field boundary. */
  let heroBottomY = 0;
  const measureHeroBottom = () => {
    const name = document.querySelector<HTMLElement>("[data-pretext-lines]");
    heroBottomY = name ? name.getBoundingClientRect().bottom : height * POINTER_TOP;
  };
  const heroBottom = () => heroBottomY;

  /* ---- sizing -------------------------------------------------------- */

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    cloud.width = Math.max(1, Math.round((width * dpr) / 2));
    cloud.height = Math.max(1, Math.round((height * dpr) / 2));

    /* Font loading can shift the hero; re-measure so the field boundary
       follows the layout, not a stale measurement. */
    measureHeroBottom();

    if (still) drawStill();
    else {
      /* Resizing reallocates the canvas, so the cloud is dropped with it. */
      trail = [];
      walkers = [];
      c.clearRect(0, 0, width, height);
      paintStatic();
    }
  };

  /* ---- the still layer ---------------------------------------------- *
   * A baseline rule and one sine. Repainted on resize and after every walk
   * frame (which clears the canvas), so it never accumulates.
   * ------------------------------------------------------------------ */

  function paintStatic() {
    /* The rule sits at the field's foot, so the copy above it stays clear. */
    const baseline = Math.round(height * BASELINE) + 0.5;

    const fade = c.createLinearGradient(0, 0, width, 0);
    fade.addColorStop(0, `rgba(${inkRgb}, 0)`);
    fade.addColorStop(0.24, `rgba(${inkRgb}, ${ruleAlpha})`);
    fade.addColorStop(0.76, `rgba(${inkRgb}, ${ruleAlpha})`);
    fade.addColorStop(1, `rgba(${inkRgb}, 0)`);
    c.strokeStyle = fade;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, baseline);
    c.lineTo(width, baseline);
    c.stroke();

    /* One sine, sampled every 2px: the only mark on an untouched cover. */
    const amp = Math.min(26, height * 0.038);
    c.strokeStyle = `rgba(${inkRgb}, ${ruleAlpha * 0.8})`;
    c.beginPath();
    for (let x = 0; x <= width; x += 2) {
      const y = baseline + Math.sin(x / 260 + time * 0.0002) * amp;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }

  /* ---- the walk ------------------------------------------------------ */

  /** Where the walkers should head: the newest point on the pointer's path
      still inside the trace window. Walked backwards, so the common case
      (the newest point is fresh) costs one comparison. */
  function target() {
    const now = performance.now();
    for (let i = trace.length - 1; i >= 0; i -= 1) {
      const p = trace[i]!;
      if (now - p.at <= TRACE_MS) return p;
    }
    return null;
  }

  function spawn(x: number, y: number) {
    if (walkers.length >= MAX_WALKERS) return;
    const top = heroBottom() + 2;
    if (y < top) y = top;
    /* Each walker gets its own seed derived from the master seed and its
       birth position, so five walkers never retrace one another. */
    let u = (seed ^ Math.round(x * 31 + y * 17)) >>> 0;
    u = (u + 1) / 0x100000000;
    walkers.push({
      x,
      y,
      u,
      angle: (u * Math.PI * 2) % (Math.PI * 2),
      age: 0,
      life: 70 + hash(u * 91.7) * 90,
    });
  }

  /** The pointer leaves a wake. That wake is the only input. */
  function emit(x: number, localY: number) {
    if (still) return;
    const gap = hasPointer ? Math.hypot(x - px, localY - py) : 0;
    const travel = Math.min(gap, MAX_TRAVEL);
    px = x;
    py = localY;
    hasPointer = true;

    /* Jitter is ignored, and a sweep has to prove itself before it counts:
       a resting cursor under the swinging cord moves a few px at a time,
       which never reaches the arming distance. */
    if (travel < MIN_TRAVEL) return;
    if (!armed) {
      charge += travel;
      if (charge < ARM_TRAVEL) return;
      /* Crossing the threshold arms the walk for good; the charge is spent
         and only a deliberate sweep can wake it again. */
      armed = 1;
      charge = 0;
      budget = BUDGET_MAX;
    }
    const now = performance.now();
    budget = Math.min(BUDGET_MAX, budget + (travel - MIN_TRAVEL) * PER_PX);

    /* Remember the path so the walk keeps heading along it for a few frames,
       rather than only toward wherever the cursor stopped. */
    trace.push({ x, y: localY, at: now });
    while (trace.length > 0 && now - trace[0]!.at > TRACE_MS) trace.shift();
    if (trace.length > TRACE_POINTS) trace.splice(0, trace.length - TRACE_POINTS);

    /* A fresh seed each event, so no two visits or two sweeps repeat. */
    seed = (seed * 1664525 + 1013904223) >>> 0;
    wake();
  }

  /** Advance every walker, bouncing it inside the field's band, and return the
      frame's segments. Dead walkers are removed. */
  function walk(dt: number): number[] {
    if (walkers.length === 0) return [];
    const segs: number[] = [];
    /** The cloud is drawn at half resolution; a 1px stroke there covers 2px
        when stretched. Keep the path 2px below the hero so the stroke's
        upper half kisses the text but never crosses it. */
    const top = heroBottom() + 2;
    const bottom = height * FIELD_BOTTOM;
    const aim = target();

    for (let i = walkers.length - 1; i >= 0; i -= 1) {
      const w = walkers[i]!;
      w.age += dt * 0.06;
      if (w.age > w.life) {
        walkers.splice(i, 1);
        continue;
      }

      /* Chaotic steps, with a gentle pull toward the pointer so the cloud
         gathers where the hand went instead of drifting off-screen. */
      for (let s = 0; s < STEPS; s += 1) {
        const u = next(w.u);
        w.angle += (u - 0.5) * 2.4;
        const nx = w.x + Math.cos(w.angle) * STRIDE;
        const ny = w.y + Math.sin(w.angle) * STRIDE;
        w.u = u;

        let x = nx + (aim ? (aim.x - nx) * STEER : 0);
        let y = ny + (aim ? (aim.y - ny) * STEER : 0);

        /* Bounce off the edges of the band. Without this a walker drifts
           off-canvas and the cloud gathers in one corner; with it the walk
           stays in the open lower half, under the name. */
        let angle = w.angle;
        if (x < 0 || x > width) {
          angle = Math.PI - angle;
          x = Math.min(Math.max(x, 0), width);
        }
        if (y < top || y > bottom) {
          angle = -angle;
          y = Math.min(Math.max(y, top), bottom);
        }
        w.angle = angle;

        segs.push(w.x, w.y, x, y);
        w.x = x;
        w.y = y;
      }
    }
    return segs;
  }

  /** Re-stroke the cloud: drop expired frames, then draw the rest in quantised
      alpha buckets so the whole fade costs six strokes. */
  function paintCloud(now: number, strength: number) {
    if (!cc) return;
    cc.clearRect(0, 0, cloud.width, cloud.height);
    if (trail.length === 0) return;

    /* Entries are in time order, so expiry is a prefix. */
    let cut = 0;
    while (cut < trail.length && now - trail[cut]!.at > FADE_MS) cut += 1;
    if (cut > 0) trail.splice(0, cut);
    if (trail.length === 0) return;

    const scale = cloud.width / Math.max(1, width);
    const paths: Path2D[] = [];
    const used: boolean[] = [];
    for (let b = 0; b < BUCKETS; b += 1) {
      paths.push(new Path2D());
      used.push(false);
    }

    for (const g of trail) {
      /* 1 at birth, 0 at FADE_MS. */
      const life = 1 - (now - g.at) / FADE_MS;
      let b = Math.floor(life * BUCKETS);
      if (b < 0) b = 0;
      else if (b > BUCKETS - 1) b = BUCKETS - 1;
      const path = paths[b]!;
      const s = g.segs;
      for (let i = 0; i < s.length; i += 4) {
        path.moveTo(s[i]! * scale, s[i + 1]! * scale);
        path.lineTo(s[i + 2]! * scale, s[i + 3]! * scale);
      }
      used[b] = true;
    }

    cc.lineWidth = 1;
    cc.lineCap = "butt";
    for (let b = 0; b < BUCKETS; b += 1) {
      if (!used[b]) continue;
      const a = ((b + 1) / BUCKETS) * CLOUD_ALPHA * strength;
      cc.strokeStyle = `rgba(${inkRgb}, ${a.toFixed(3)})`;
      cc.stroke(paths[b]!);
    }
  }

  function stepWalk(dt: number, now: number) {
    c.clearRect(0, 0, width, height);
    paintStatic();

    const aim = target();
    if (budget > 0 && aim) spawn(aim.x, aim.y);

    const segs = walk(dt);
    if (segs.length > 0) trail.push({ at: now, segs });

    paintCloud(now, 1);
    c.drawImage(cloud, 0, 0, width, height);
  }

  /** Under reduced motion the walk is a finished drawing, not a loop: one
      long chaotic walk, laid down once, from the seed. */
  function drawStill() {
    c.clearRect(0, 0, width, height);
    paintStatic();
    if (!cc) return;

    const scale = cloud.width / Math.max(1, width);
    const segs: number[] = [];
    const top = heroBottom() + 2;
    const bottom = height * FIELD_BOTTOM;

    let u = ((seed % 1000) / 1000 + 0.001) % 1;
    let x = width * 0.12;
    let y = Math.max(top + (bottom - top) * 0.6, top);
    let angle = 0;

    for (let i = 0; i < 2600; i += 1) {
      u = next(u);
      angle += (u - 0.5) * 2.4;
      const nx = x + Math.cos(angle) * STRIDE;
      const ny = y + Math.sin(angle) * STRIDE;
      if (nx < 0 || nx > width) {
        angle = Math.PI - angle;
        x = Math.min(Math.max(nx, 0), width);
      } else x = nx;
      if (ny < top || ny > bottom) {
        angle = -angle;
        y = Math.min(Math.max(ny, top), bottom);
      } else y = ny;
      segs.push(x - Math.cos(angle) * STRIDE, y - Math.sin(angle) * STRIDE, x, y);
    }

    const now = performance.now();
    trail = [{ at: now, segs }];
    paintCloud(now, STILL_STRENGTH);
    c.drawImage(cloud, 0, 0, width, height);
    trail = [];
  }

  /* ---- the loop ------------------------------------------------------ */

  const awake = () =>
    !still && inView && (budget > 0 || walkers.length > 0 || trail.length > 0);

  const settle = () => {
    /* Nothing left to draw: drop the cloud so a later sweep starts from the
       finished drawing instead of from a ghost of this one. */
    trail = [];
    walkers = [];
    charge = 0;
    cc?.clearRect(0, 0, cloud.width, cloud.height);
    paintStatic();
    delete canvas.dataset.awake;
  };

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 48) : 16.7;
    last = now;
    time += dt;
    /* Spent per frame, so the loop's length is bounded however much the
       pointer swept through. */
    budget = Math.max(0, budget - 1);
    stepWalk(dt, now);

    if (awake() && inView) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = 0;
      settle();
    }
  };

  const wake = () => {
    if (raf === 0 && awake()) {
      last = 0;
      /* A machine-readable "the field is walking" flag. The QA motion suite
         asserts on this rather than on the global rAF count, because the pull
         cord has an idle tug of its own that has nothing to do with the field. */
      canvas.dataset.awake = "1";
      raf = requestAnimationFrame(tick);
    }
  };

  /* ---- input --------------------------------------------------------- */

  const onPointerMove = (event: PointerEvent) => {
    /* A finger only disturbs the field while it is down; a mouse always does. */
    if (event.pointerType !== "mouse" && event.buttons === 0) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.height <= 0) return;
    const localY = event.clientY - rect.top;
    const x = event.clientX - rect.left;
    /* Only the open lower part of the cover counts: a hand over the name or
       the nav is reading, not drawing, and must not disturb the field. */
    if (localY < heroBottom()) {
      px = x;
      py = localY;
      hasPointer = true;
      return;
    }
    emit(x, localY);
  };

  const onPointerLeave = () => {
    hasPointer = false;
    charge = 0;
  };

  const onThemeChange = () => {
    readPalette();
    if (still) {
      drawStill();
      return;
    }
    if (walkers.length === 0) {
      trail = [];
      cc?.clearRect(0, 0, cloud.width, cloud.height);
      c.clearRect(0, 0, width, height);
      paintStatic();
    }
  };

  const onVisibility = () => {
    if (!document.hidden) return;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    delete canvas.dataset.awake;
  };

  /* ---- lifecycle ----------------------------------------------------- */

  readPalette();
  resize();

  /* The ink changes with the theme, so the palette is re-read. The pull cord
     flips `data-theme` on <html>; observing it is cheaper than importing the
     cord, and it works on both paths. */
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  /* A resize reallocates the canvas, so the still frame has to be redrawn on
     both paths — otherwise a window resize under reduced motion blanks it. */
  window.addEventListener("resize", resize, { passive: true });
  const sizeObserver =
    "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  sizeObserver?.observe(host);

  /* Nothing outside the cover needs to know it exists; stop walking when it
     scrolls away. */
  let observer: IntersectionObserver | null = null;

  const teardown = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    themeObserver.disconnect();
    sizeObserver?.disconnect();
    observer?.disconnect();
    delete canvas.dataset.awake;
  };

  if (still) {
    /* No rAF and no pointer listeners: the drawing is the finished state. */
    return teardown;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
        if (inView) return;
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        trail = [];
        walkers = [];
        cc?.clearRect(0, 0, cloud.width, cloud.height);
        paintStatic();
        delete canvas.dataset.awake;
      },
      { threshold: 0.01 },
    );
    observer.observe(host);
  }

  return teardown;
}