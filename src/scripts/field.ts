import { reducedMotion } from "@/lib/spring";

/**
 * The cover's field.
 *
 * A rule, not an illustration: one hairline sine drawn across the cover, and a
 * drift of particles the pointer leaves behind it. It never becomes the
 * subject — it sits under the name, in ink at a low alpha, and it stops the
 * moment nothing is happening.
 *
 * Three costs had to be kept down:
 *
 *  - **No idle loop.** The cover is a title page, so a rAF that ran forever
 *    would be motion to announce itself. A pointer sweep *adds* a fixed amount
 *    of particle life (`BUDGET_MAX`); every frame *spends* one unit. When the
 *    budget and the particles are both gone the loop stops, so a resting page
 *    runs zero frames — which is exactly what the QA motion suite asserts.
 *  - **No layout reads.** The canvas is a background, so the pointer is taken
 *    from `window` (`pointermove` fires there even though the canvas is
 *    `pointer-events-none`), and the size comes from a `ResizeObserver` plus
 *    `devicePixelRatio`, never from the scroll position.
 *  - **No theme constants.** The ink is read from the live `--color-ink` token
 *    and re-read when `data-theme` flips, so a dark-mode visitor gets light
 *    dust and a swap never leaves a ghost of the old colour.
 */

/** One unit of budget is one 60 Hz frame of particle life. */
const BUDGET_MAX = 9;
/** Budget per pixel of deliberate travel beyond the jitter threshold. */
const PER_PX = 0.09;
/** Travel below this is jitter (the cord's idle tug shifts the page a few px).
    Ignoring it keeps the field asleep unless a hand really moved. */
const MIN_TRAVEL = 16;
/** A sweep has to move this far in total before the field wakes at all, so a
    cursor resting under a gently swinging cord never starts it. */
const ARM_TRAVEL = 120;
/** Once armed, the field keeps painting for this long after the last real
    movement. It is a ceiling, not a target: a slow drift dies sooner because
    the budget runs out first. */
const TAIL_MS = 340;
/** Travel is capped per event so a teleporting cursor cannot flood the field. */
const MAX_TRAVEL = 160;
const MAX_PARTICLES = 260;
/** Particles seeded per frame while budget remains. */
const PER_FRAME = 4;
/** Peak alpha of one particle's streak. A field this light still has to be
    seen against paper, so the peak sits near a hairline's weight. */
const PARTICLE_ALPHA = 0.5;
/** Where the sine's still line rides, as a fraction of the cover's height. */
const BASELINE = 0.9;
/** Pointer travel above this line is reading, not drawing, and is ignored.
    The nav and the pull cord live in that band, so their motion cannot wake
    the field — only a hand in the open lower half can. */
const FIELD_TOP = 0.48;
/** How much of the pointer's recent path the wake keeps re-seeding, and for
    how long. This is what turns a dot into a trail. */
const TRACE_MS = 160;
const TRACE_POINTS = 12;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  seed: number;
}

/** Deterministic hash — the still frame is identical on every visit. */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43_758.5453;
  return s - Math.floor(s);
}

/** A cheap, smooth flow field: the heading a particle drifts toward. */
function flow(x: number, y: number, t: number) {
  return (
    Math.sin(x * 0.0021 + t * 0.00007) * 1.7 +
    Math.cos(y * 0.0027 - t * 0.00005) * 1.7
  );
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

export function initField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = ctx;

  const still = reducedMotion();
  const host = canvas.parentElement ?? canvas;

  let width = 1;
  let height = 1;

  let particles: Particle[] = [];
  /** Recent pointer positions, so the wake seeds along the path travelled. */
  const trace: { x: number; y: number; at: number }[] = [];
  let raf = 0;
  let last = 0;
  let time = 0;
  let inView = true;

  let budget = 0;
  /** 0 until the pointer has travelled far enough to count as a hand. */
  let armed = 0;
  let charge = 0;
  /** Timestamp of the last deliberate movement, for the hold. */
  let held = 0;
  let hasPointer = false;
  let px = 0;
  let py = 0;

  /* The ink and the rule's strength, both from live tokens. */
  let inkRgb = "20, 17, 14";
  let ruleAlpha = 0.14;

  const readPalette = () => {
    const s = getComputedStyle(document.documentElement);
    inkRgb = hexToRgb(s.getPropertyValue("--color-ink").trim() || "#14110e");
    /* A dark room needs a slightly stronger rule to read at all. */
    ruleAlpha = document.documentElement.dataset.theme === "dark" ? 0.22 : 0.14;
  };

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
    if (still) drawStill();
    else {
      c.clearRect(0, 0, width, height);
      paintStatic();
    }
  };

  /* ---- the still layer ---------------------------------------------- *
   * A baseline rule and one sine. Repainted on resize and after every
   * particle frame (which clears the canvas), so it never accumulates.
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

    /* One sine riding the rule: the only mark on an untouched cover. */
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

  /* ---- particles ----------------------------------------------------- */

  function spawn(x: number, y: number, scatter = 9) {
    if (particles.length >= MAX_PARTICLES) return;
    const angle = flow(x, y, time) + (Math.random() - 0.5) * 0.9;
    const speed = 0.22 + Math.random() * 0.5;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * scatter;
    particles.push({
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 70 + Math.random() * 90,
      seed: Math.random(),
    });
  }

  /** The pointer leaves a wake. That wake is the only input.
      `localY` is the position inside the canvas; `onPointerMove` has already
      discarded anything above the field's band. */
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
      /* Crossing the threshold arms the field for good; the charge is spent
         and only a deliberate sweep can wake it again. */
      armed = 1;
      charge = 0;
      budget = BUDGET_MAX;
    }
    held = performance.now();
    budget = Math.min(BUDGET_MAX, budget + (travel - MIN_TRAVEL) * PER_PX);
    /* Remember the path so the wake keeps seeding along it for a few frames,
       rather than only at wherever the cursor stopped. */
    trace.push({ x, y: localY, at: held });
    while (trace.length > 0 && held - trace[0]!.at > TRACE_MS) trace.shift();
    if (trace.length > TRACE_POINTS) trace.splice(0, trace.length - TRACE_POINTS);
    wake();
  }

  function stepParticles(dt: number) {
    c.clearRect(0, 0, width, height);
    paintStatic();

    /* The budget seeds at a steady rate along the recent path, so a fast
       sweep and a slow one both read as a trail rather than a burst. */
    if (budget > 0) {
      const now = performance.now();
      const live = trace.filter((p) => now - p.at <= TRACE_MS);
      const points = live.length > 0 ? live : [{ x: px, y: py, at: now }];
      /* Spread the budget across the path, so a short flick draws a short
         streak and a long sweep draws a long one. */
      const share = Math.max(1, Math.min(PER_FRAME, Math.ceil(budget)));
      for (let i = 0; i < share; i += 1) {
        const p = points[Math.floor((i / share) * points.length)] ?? points[0]!;
        spawn(p.x, p.y, 10);
      }
    }

    /* One path per alpha bucket, so the whole field costs a handful of draw
       calls however many particles are alive. */
    const buckets = new Map<number, Path2D>();
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i]!;
      const angle = flow(p.x, p.y, time);
      p.vx += (Math.cos(angle) - p.vx) * 0.035;
      p.vy += (Math.sin(angle) - p.vy) * 0.035;
      const nx = p.x + p.vx * dt * 0.06;
      const ny = p.y + p.vy * dt * 0.06;
      p.x = nx;
      p.y = ny;
      p.age += dt * 0.06;

      const left = 1 - p.age / p.life;
      if (left <= 0 || nx < -24 || nx > width + 24 || ny < -24 || ny > height + 24) {
        particles.splice(i, 1);
        continue;
      }
      /* In over the first tenth, out over the rest. */
      const alpha = Math.min(1, p.age / 10) * Math.pow(left, 0.7) * (0.5 + p.seed * 0.5);
      /* A streak smeared across the pixel grid: a hairline landing on a
         half-pixel antialiases to a third of its alpha, so both offsets are
         drawn and the pair reads as one line. */
      const tail = 1.4 + p.seed * 2;
      const tx = p.x - p.vx * tail;
      const ty = p.y - p.vy * tail;
      const key = Math.round(alpha * 5) / 5;
      let path = buckets.get(key);
      if (!path) {
        path = new Path2D();
        buckets.set(key, path);
      }
      /* Three passes, each nudged half a pixel vertically: a one-pixel
         hairline that lands between two pixel rows antialiases to a third of
         its alpha, so both neighbours are drawn and the streak reads as one
         solid line. */
      path.moveTo(tx, ty);
      path.lineTo(nx, ny);
      path.moveTo(tx, ty - 0.5);
      path.lineTo(nx, ny - 0.5);
      path.moveTo(tx, ty + 0.5);
      path.lineTo(nx, ny + 0.5);
    }

    c.lineWidth = 1;
    c.lineCap = "butt";
    for (const [alpha, path] of buckets) {
      c.strokeStyle = `rgba(${inkRgb}, ${(alpha * PARTICLE_ALPHA).toFixed(2)})`;
      c.stroke(path);
    }
  }

  /** Under reduced motion the field is a finished drawing, not a loop. */
  function drawStill() {
    c.clearRect(0, 0, width, height);
    paintStatic();
    /* The still version is the same drawing the pointer would have made: a
       scatter spread evenly across the field's band, thickest along the
       baseline, at the same weight as a wake. */
    const dots = Math.min(900, Math.round((width * height) / 3600));
    for (let i = 0; i < dots; i += 1) {
      const x = Math.round(hash(i * 1.7) * width);
      /* Squared distribution packs the dots toward the foot of the band. */
      const t = hash(i * 3.1 + 7) ** 2;
      const y = Math.round(height * (FIELD_TOP + (BASELINE + 0.02 - FIELD_TOP) * t));
      const a = 0.1 + hash(i * 5.3) * 0.28;
      const len = 1 + Math.round(hash(i * 9.1) * 3);
      c.fillStyle = `rgba(${inkRgb}, ${a.toFixed(2)})`;
      c.fillRect(x, y, len, 1);
    }
  }

  /* ---- the loop ------------------------------------------------------ */

  const awake = () =>
    !still &&
    inView &&
    (budget > 0 || (held > 0 && performance.now() - held < TAIL_MS && particles.length > 0));

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 48) : 16.7;
    last = now;
    time += dt;
    /* The budget is spent per frame, so the loop's length is bounded however
       much the pointer swept through; the hold only sets a ceiling. */
    budget = Math.max(0, budget - 1);
    const holding = held > 0 && now - held < TAIL_MS;
    stepParticles(dt);

    if (budget > 0 || (holding && particles.length > 0)) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = 0;
      particles = [];
      held = 0;
      charge = 0;
      /* Land on the finished drawing rather than an empty canvas. */
      paintStatic();
    }
  };

  const wake = () => {
    if (raf === 0 && awake()) {
      last = 0;
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
    /* Only the open lower part of the cover counts: a hand over the name or
       the nav is reading, not drawing, and must not disturb the field. */
    if (localY / rect.height < FIELD_TOP) {
      px = event.clientX - rect.left;
      py = localY;
      hasPointer = true;
      return;
    }
    emit(event.clientX - rect.left, localY);
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
    if (particles.length === 0) {
      c.clearRect(0, 0, width, height);
      paintStatic();
    }
  };

  const onVisibility = () => {
    if (!document.hidden) return;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };

  /* ---- lifecycle ----------------------------------------------------- */

  readPalette();
  resize();

  const teardown = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  if (still) {
    /* No observer, no rAF, no listeners: the drawing is the finished state. */
    return teardown;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
        if (inView) return;
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        paintStatic();
      },
      { threshold: 0.01 },
    );
    observer.observe(host);
  }

  document.addEventListener("visibilitychange", onVisibility);

  /* A theme swap changes the ink, so the palette is re-read. The pull cord
     flips `data-theme`; observing it is cheaper than importing the cord. */
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    teardown();
    themeObserver.disconnect();
  };
}