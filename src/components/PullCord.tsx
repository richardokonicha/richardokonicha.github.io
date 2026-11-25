"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";

import { clamp, reducedMotion, spring, step, tune } from "@/lib/spring";

/**
 * Pull Cord — a lamp on a wire with a cord you can really pull.
 *
 * The cord is a chain of 12 points with weight, held at length by soft links,
 * so it hangs, swings and whips like a rope. Pull past the click and the light
 * comes on: it floods the little room from the bulb, and the page follows.
 *
 * The motion is the original's: the same stiffness and damping, the same link
 * solver, the same 4 substeps. Only the geometry is scaled to a corner widget
 * and the switch is wired to the site's theme instead of a card's.
 */

/* geometry, scaled from the original 124×66 shade to fit a 140×260 corner */
const WIRE = 62;
const SHADE = 46;
const AX = 23;
const AY = SHADE - 3;
const N = 12;
const SEG = 6;
const L = N * SEG;
const CLICK = 22;
const MAXS = 54;

const THEME_KEY = "ro-theme";

function applyTheme(light: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-anim");
  window.setTimeout(() => root.classList.remove("theme-anim"), 420);
  if (light) delete root.dataset.theme;
  else root.dataset.theme = "dark";
  try {
    window.localStorage.setItem(THEME_KEY, light ? "light" : "dark");
  } catch {
    /* private mode: the theme just won't persist */
  }
}

/** the two little rooms: an unlit one, and the lit one the lamp floods */
const ROOMS = {
  dark: {
    "--room-cord": "#8a8175",
    "--room-bead": "#f4f0e6",
    "--room-shade": "#2a2620",
    "--room-cap": "#4a443b",
    "--room-bulb": "#3b352c",
    "--room-glow": "0 0 0 0 rgb(232 163 61 / 0%)",
  } as CSSProperties,
  lit: {
    "--room-cord": "#8a8175",
    "--room-bead": "#14110e",
    "--room-shade": "#e4dccd",
    "--room-cap": "#c9bfa9",
    "--room-bulb": "#e8a33d",
    "--room-glow": "0 0 22px 6px rgb(232 163 61 / 40%)",
  } as CSSProperties,
};

export default function PullCord() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLDivElement>(null);
  const darkRoomRef = useRef<HTMLDivElement>(null);
  const litRoomRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const lit = litRef.current;
    const grab = grabRef.current;
    if (!wrap || !lit || !grab) return;

    type Room = {
      lamp: HTMLElement;
      wire: SVGPathElement;
      head: HTMLElement;
      bulb: HTMLElement;
      cord: SVGPathElement;
      bead: HTMLElement;
    };

    const readRoom = (root: HTMLDivElement): Room | null => {
      const q = <T extends Element>(sel: string) => root.querySelector(sel) as T | null;
      const lamp = q<HTMLElement>(".lamp");
      const wire = q<SVGPathElement>(".wire");
      const head = q<HTMLElement>(".head");
      const bulb = q<HTMLElement>(".bulb");
      const cord = q<SVGPathElement>(".cord");
      const bead = q<HTMLElement>(".bead");
      if (!lamp || !wire || !head || !bulb || !cord || !bead) return null;
      return { lamp, wire, head, bulb, cord, bead };
    };

    const rooms: Room[] = [];
    if (darkRoomRef.current) {
      const r = readRoom(darkRoomRef.current);
      if (r) rooms.push(r);
    }
    if (litRoomRef.current) {
      const r = readRoom(litRoomRef.current);
      if (r) rooms.push(r);
    }
    if (rooms.length < 2) return;

    /* ---- springs: the original's stiffness and damping ---- */
    // The stored theme decides whether the lamp starts lit, so a dark-mode
    // visitor never sees the lit room flash before the first frame.
    let on = !document.documentElement.dataset.theme;

    const TH = spring(0, 46, 3); // lamp angle
    const TUG = spring(0, 300, 13); // drop on the wire
    const R = spring(on ? 1 : 0, 120, 21); // light radius, 0..1
    const BP = spring(on ? 1 : 0, 420, 13); // bulb pop
    const HX = spring(0, 210, 22); // the idle hand
    const HY = spring(0, 210, 22);
    const K = spring(1, 300, 17); // cord stretch

    grab.setAttribute("aria-checked", String(on));

    let armed = true;
    let held: {
      id: number;
      x: number;
      y: number;
      ox: number;
      oy: number;
      moved: number;
      sx: number;
      sy: number;
      flipped: boolean;
    } | null = null;
    let ghost = false;
    let stretch = 0;
    let lean = 0;
    let clock = 0;
    let userUntil = 0;
    let side = 1;
    let W = 0;
    let H = 0;

    const pts = Array.from({ length: N + 1 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }));

    const anchor = () => {
      const c = Math.cos(TH.x);
      const s = Math.sin(TH.x);
      const y = WIRE + TUG.x + AY;
      return [W / 2 + AX * c - y * s, AX * s + y * c];
    };

    const bulbAt = () => {
      const c = Math.cos(TH.x);
      const s = Math.sin(TH.x);
      /* 53 = the bulb's own centre (top 38 + half of 30); the glow is cast from
         here, so the clip circle has to open from the same point */
      const y = WIRE + TUG.x + 53;
      return [W / 2 - y * s, y * c];
    };

    const measure = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      if (!pts[0].x && !pts[0].y) {
        const [ax, ay] = anchor();
        for (let i = 0; i <= N; i++) {
          pts[i].x = ax;
          pts[i].y = ay + i * SEG;
        }
      }
    };
    measure();

    /* ---- timers, on sim time so slow motion would slow them too ---- */
    const timers: { t: number; fn: () => void }[] = [];
    const after = (sec: number, fn: () => void) => {
      const timer = { t: sec, fn };
      timers.push(timer);
      return timer;
    };

    const flip = (to = !on) => {
      if (to === on) return;
      on = to;
      grab.setAttribute("aria-checked", String(on));
      BP.x = on ? 1.35 : 0.8;
      TUG.v += 150;
      applyTheme(on);
    };

    const pin = (): [number, number] | null =>
      held ? [held.x, held.y] : ghost ? [HX.x, HY.x] : null;

    /**
     * A pull nobody is holding. `demo` pulls far enough to swing but stops
     * short of the click: the cord must never change the theme on its own,
     * only invite a hand. Only a real pull — pointer, touch or keyboard —
     * crosses the threshold.
     */
    const pull = (demo = false) => {
      if (ghost || held) return;
      const b = pts[N];
      ghost = true;
      armed = true;
      side = -side;
      HX.x = b.x;
      HY.x = b.y;
      HX.v = b.vx;
      HY.v = b.vy;
      const [ax, ay] = anchor();
      HX.t = ax + side * 26;
      HY.t = ay + L + (demo ? 28 : 48);
      after(1.1, () => {
        ghost = false;
      });
      wake();
    };

    const local = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    const onDown = (e: PointerEvent) => {
      const [x, y] = local(e);
      const b = pts[N];
      held = {
        id: e.pointerId,
        x: b.x,
        y: b.y,
        ox: b.x - x,
        oy: b.y - y,
        moved: 0,
        sx: x,
        sy: y,
        flipped: false,
      };
      ghost = false;
      armed = true;
      userUntil = performance.now() + 7000;
      try {
        grab.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety */
      }
      grab.classList.add("cursor-grabbing");
      wake();
    };

    const onMove = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      const [x, y] = local(e);
      held.x = x + held.ox;
      held.y = y + held.oy;
      held.moved = Math.max(held.moved, Math.hypot(x - held.sx, y - held.sy));
      userUntil = performance.now() + 7000;
      wake();
    };

    const onUp = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      const tap = held.moved < 5 && !held.flipped && e.type === "pointerup";
      held = null;
      grab.classList.remove("cursor-grabbing");
      if (tap) pull(false);
      else wake();
    };

    /* keyboard and screen-reader activation arrive with detail === 0 */
    const onClick = (e: MouseEvent) => {
      if (e.detail) return;
      userUntil = performance.now() + 7000;
      flip();
      wake();
    };

    const onResize = () => {
      measure();
      wake();
    };
    const onVisible = () => {
      if (!document.hidden) wake();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisible);

    grab.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    grab.addEventListener("click", onClick);

    /* It tugs at itself now and then, so the invitation is not a mystery.
       Never a theme change — see `pull(demo)`. This runs on wall time, not sim
       time, because the loop sleeps once the rope has settled. */
    const IDLE_MS = 11_000;
    let idleTimer = 0;
    const scheduleIdle = () => {
      idleTimer = window.setTimeout(() => {
        if (!reducedMotion() && performance.now() >= userUntil && !held && !ghost) {
          pull(true);
          wake();
        }
        scheduleIdle();
      }, IDLE_MS);
    };
    scheduleIdle();

    /* ---- the loop ----
       The rope always ends up hanging still, so the loop sleeps once nothing is
       moving. Any input, the idle timer, or a resize wakes it again. */
    let raf = 0;
    let last = 0;

    const settled = () => {
      if (held || ghost || timers.length > 0) return false;
      for (const s of [TH, TUG, R, BP, HX, HY, K]) {
        if (Math.abs(s.v) > 0.02 || Math.abs(s.x - s.t) > 0.02) return false;
      }
      for (let i = 1; i <= N; i++) {
        if (Math.abs(pts[i].vx) > 0.6 || Math.abs(pts[i].vy) > 0.6) return false;
      }
      return true;
    };

    const frame = (dt: number) => {
      clock += dt;
      [TH, TUG, R, BP, HX, HY, K].forEach((s) => step(s, dt));
      if (dt <= 0) return;
      const [ax, ay] = anchor();
      const p = pin();
      const b = pts[N];

      let px = 0;
      let py = 0;
      stretch = 0;
      lean = 0;
      if (p) {
        const dx = p[0] - ax;
        const dy = p[1] - ay;
        const d = Math.hypot(dx, dy) || 1;
        const over = Math.max(0, d - L);
        const give = MAXS * (1 - Math.exp(-over / 70));
        const r = Math.min(d, L) + give;
        px = ax + (dx / d) * r;
        py = ay + (dy / d) * r;
        stretch = give;
        lean = over > 0 ? dx / d : 0;
        if (over > 0) {
          K.x = K.t = r / L;
          K.v = 0;
        }
        if (armed && give > CLICK) {
          armed = false;
          flip();
          if (held) held.flipped = true;
          else
            after(0.12, () => {
              ghost = false;
            });
        }
      }
      if (!p || !stretch) K.t = 1;
      const seg = SEG * Math.max(1, K.x);
      TUG.t = stretch * 0.22;
      TH.t = clamp((-lean * stretch) / MAXS / 2, -0.3, 0.3);

      const prev = pts.map((q) => [q.x, q.y]);
      for (let i = 1; i <= N; i++) {
        const q = pts[i];
        const k = Math.exp(-(i === N ? 1.1 : 2.4) * dt);
        q.vy += 2600 * dt;
        q.vx *= k;
        q.vy *= k;
        const sp = Math.hypot(q.vx, q.vy);
        if (sp > 2600) {
          q.vx *= 2600 / sp;
          q.vy *= 2600 / sp;
        }
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }

      for (let it = 0; it < 8; it++) {
        pts[0].x = ax;
        pts[0].y = ay;
        if (p) {
          b.x = px;
          b.y = py;
        }
        for (let i = 0; i < N; i++) {
          const a = pts[i];
          const c = pts[i + 1];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const f = ((d - seg) / d) * 0.5;
          const wa = i === 0 ? 0 : 1;
          const wc = i + 1 === N ? (p ? 0 : 0.3) : 1;
          const sum = wa + wc || 1;
          a.x += ((dx * f * wa) / sum) * 2;
          a.y += ((dy * f * wa) / sum) * 2;
          c.x -= ((dx * f * wc) / sum) * 2;
          c.y -= ((dy * f * wc) / sum) * 2;
        }
      }

      pts[0].x = ax;
      pts[0].y = ay;
      if (p) {
        b.x = px;
        b.y = py;
      }
      for (let i = 1; i <= N; i++) {
        pts[i].vx = (pts[i].x - prev[i][0]) / dt;
        pts[i].vy = (pts[i].y - prev[i][1]) / dt;
      }

      R.t = on ? 1 : 0;
      tune(R, on ? 120 : 170, on ? 21 : 27);
    };

    const render = () => {
      const th = TH.x;
      const tug = TUG.x;
      const b = pts[N];
      const e = pts[N - 1];

      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < N; i++) {
        d += `Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${(
          (pts[i].x + pts[i + 1].x) /
          2
        ).toFixed(1)} ${((pts[i].y + pts[i + 1].y) / 2).toFixed(1)}`;
      }
      d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;

      const ang = Math.atan2(e.x - b.x, b.y - e.y);
      const wl = WIRE + tug - 4;
      const wd = `M${(W / 2).toFixed(1)} -4L${(W / 2 - Math.sin(th) * wl).toFixed(2)} ${(
        Math.cos(th) * wl
      ).toFixed(2)}`;

      for (const o of rooms) {
        o.lamp.style.transform = `rotate(${th.toFixed(4)}rad)`;
        o.wire.setAttribute("d", wd);
        o.head.style.transform = `translateY(${(WIRE + tug).toFixed(2)}px)`;
        o.bulb.style.transform = `scale(${BP.x.toFixed(4)})`;
        o.cord.setAttribute("d", d);
        o.bead.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(
          2,
        )}px) rotate(${ang.toFixed(4)}rad)`;
      }
      grab.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px)`;

      const [bx, by] = bulbAt();
      const far = Math.hypot(Math.max(bx, W - bx), Math.max(by, H - by)) + 24;
      const r = Math.max(0, R.x) * far;
      lit.style.visibility = r < 4 ? "hidden" : "visible";
      lit.style.clipPath = `circle(${r.toFixed(1)}px at ${bx.toFixed(1)}px ${by.toFixed(
        1,
      )}px)`;
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      for (let i = timers.length - 1; i >= 0; i--) {
        timers[i].t -= dt;
        if (timers[i].t <= 0) timers.splice(i, 1)[0].fn();
      }
      const sub = 4;
      for (let k = 0; k < sub; k++) frame(dt / sub);
      render();
      raf = settled() ? 0 : requestAnimationFrame(loop);
    };

    function wake() {
      render();
      if (raf === 0 && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    }

    // Paint once before the first frame, so the room matches the stored theme
    // immediately instead of one frame later.
    render();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
      grab.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      grab.removeEventListener("click", onClick);
    };
  }, []);

  const room = (roomRef: RefObject<HTMLDivElement | null>, vars: CSSProperties) => (
    <div ref={roomRef} className="absolute inset-0" style={vars}>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="wire"
          d=""
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: "var(--room-cord)" }}
        />
      </svg>

      <div className="lamp absolute top-0 left-1/2 h-0 w-0">
        <div className="head absolute top-0 left-0">
          <i
            className="bulb absolute top-[38px] left-[-15px] h-[30px] w-[30px] rounded-full"
            style={{ background: "var(--room-bulb)", boxShadow: "var(--room-glow)" }}
          />
          <i
            className="absolute top-0 left-[-44px] h-[46px] w-[88px]"
            style={{
              borderRadius: "44px 44px 10px 10px / 40px 40px 10px 10px",
              background: "var(--room-shade)",
            }}
          />
          <i
            className="absolute top-[-8px] left-[-7px] h-[11px] w-[14px]"
            style={{ borderRadius: "4px 4px 0 0", background: "var(--room-cap)" }}
          />
        </div>
      </div>

      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="cord"
          d=""
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: "var(--room-cord)" }}
        />
      </svg>

      <i
        className="bead absolute top-[-3px] left-[-8px] h-[26px] w-[16px] rounded-full"
        style={{ background: "var(--room-bead)" }}
      />
    </div>
  );

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed top-[1rem] right-[clamp(0.75rem,3vw,2rem)] z-[65] h-[260px] w-[140px] overflow-visible bg-transparent max-md:top-[0.75rem] max-md:right-[0.75rem]"
    >
      {room(darkRoomRef, ROOMS.dark)}
      <div
        ref={litRef}
        data-lit=""
        className="absolute inset-0 bg-lamp-lit"
        style={{ clipPath: "circle(0px at 50% 40%)", visibility: "hidden" }}
      >
        {room(litRoomRef, ROOMS.lit)}
      </div>

      <button
        ref={grabRef}
        type="button"
        role="switch"
        aria-label="Light mode"
        className="pointer-events-auto absolute top-[-10px] left-[-20px] h-[46px] w-[40px] cursor-grab touch-none bg-transparent select-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </div>
  );
}