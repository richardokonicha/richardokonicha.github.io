"use client";

/**
 * Now Playing — a record deck you can spin.
 *
 * Ported from Kokonut UI's `liquid-glass-card` (MIT, @dorianbaffier) and rebuilt
 * on this project's tokens: square corners, 1px rules, paper and ink.
 *
 * Two deliberate departures from the original:
 *
 *  1. It is a real player. The original integrates a simulated clock from the
 *     disc's angular velocity; here the audio element owns the time, and the
 *     disc's spin is the visual. Scrubbing the record still seeks the track.
 *  2. It floats, and it can be dragged anywhere. The position is remembered.
 */

import { DetentText } from "@hayderkg/detent/text";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tracks } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/*  Constants — the original's, unchanged                                   */
/* -------------------------------------------------------------------------- */

// 33⅓ rpm is 200°/s, one turn every 1.8s.
const CRUISE = 200;
const CRUISE_MS = 1800;
// Fastest a flick may spin the disc (6 turns/s).
const MAX_OMEGA = 2160;
// Time constants (s) for the speed relaxing toward its target.
const COAST_TAU = 0.45;
const SPIN_UP_TAU = 0.22;
const SPIN_DOWN_TAU = 0.2;
const SETTLE_EPSILON = 2;
// Pointer movement this close to the centre gives wild angle jumps.
const DEAD_ZONE = 10;
const VELOCITY_WINDOW_MS = 80;
// A release this long after the last move is a release from rest.
const STALE_MOVE_MS = 60;
// A finger resting on the disc reads as zero speed within ~50ms.
const HOLD_SETTLE_S = 0.05;
// Level bars.
const BAR_COUNT = 5;
const BAR_REST = 0.14;
const BAR_DECAY_S = 0.3;
const BAR_ATTACK_S = 0.08;
// Scrubber.
const RUBBER_MAX = 18;
const SEEK_STEP = 5;
const RESTART_THRESHOLD = 3;
const MAX_DT = 0.05;
const ROLL_MS = 220;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const RUBBER_RETURN = "transform 450ms cubic-bezier(0.34, 1.4, 0.64, 1)";

const POS_KEY = "ro-player-pos";
const VOL_KEY = "ro-player-vol";
const MUTE_KEY = "ro-player-muted";
const DEFAULT_VOLUME = 0.6;

const ROLL_KEYFRAMES = `@keyframes now-playing-in-up{from{transform:translateY(90%);opacity:0}to{transform:none;opacity:1}}
@keyframes now-playing-out-up{from{transform:none;opacity:1}to{transform:translateY(-90%);opacity:0}}
@keyframes now-playing-in-down{from{transform:translateY(-90%);opacity:0}to{transform:none;opacity:1}}
@keyframes now-playing-out-down{from{transform:none;opacity:1}to{transform:translateY(90%);opacity:0}}
@media (prefers-reduced-motion:reduce){.now-playing-roll{animation:none!important}.now-playing-roll-prev{display:none}}`;

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function damp(distance: number, max: number) {
  return max * (1 - Math.exp(-distance / max));
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function readStore(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

/* Deterministic 1D value noise. The meter is a function of track time, so
   scrubbing back over a passage replays the same levels. */
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43_758.5453;
  return s - Math.floor(s);
}

function noise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function barLevel(index: number, t: number) {
  return (
    0.6 * noise(t * 4.3 + index * 17.3) +
    0.4 * noise(t * 9.1 + index * 31.7 + 100)
  );
}

// Up to cruise speed the disc maps 1:1 to the track like a real record;
// faster spins accelerate, so a hard flick can cross most of a song.
function scrubGain(speed: number) {
  const excess = Math.max(0, Math.abs(speed) - CRUISE) / CRUISE;
  return 1 + 1.5 * excess ** 1.5;
}

function rotate(angle: number) {
  return `rotate(${Math.round((angle % 360) * 100) / 100}deg)`;
}

/* -------------------------------------------------------------------------- */
/*  Engine                                                                    */
/* -------------------------------------------------------------------------- */

interface Engine {
  angle: number;
  omega: number;
  time: number;
  duration: number;
  playing: boolean;
  held: boolean;
  barDrag: boolean;
  volDrag: boolean;
  pointerId: number | null;
  visible: boolean;
  reduced: boolean;
  env: number;
  scrubOmega: number;
  pointerAngle: number;
  center: { x: number; y: number };
  lastMoveAt: number;
  samples: { t: number; a: number }[];
  cruise: Animation | null;
  cruiseAngle: number;
}

function createEngine(duration: number, playing: boolean): Engine {
  return {
    angle: 0,
    omega: playing ? CRUISE : 0,
    time: 0,
    duration,
    playing,
    held: false,
    barDrag: false,
    volDrag: false,
    pointerId: null,
    visible: true,
    reduced: false,
    env: 0,
    scrubOmega: 0,
    pointerAngle: 0,
    center: { x: 0, y: 0 },
    lastMoveAt: 0,
    samples: [],
    cruise: null,
    cruiseAngle: 0,
  };
}

function readAngle(e: Engine) {
  if (e.cruise && e.cruise.currentTime !== null) {
    return e.cruiseAngle + (Number(e.cruise.currentTime) / CRUISE_MS) * 360;
  }
  return e.angle;
}

function stopCruise(e: Engine, disc: HTMLElement | null) {
  if (!e.cruise) return;
  e.angle = readAngle(e);
  // Pin the angle inline before cancelling so the disc doesn't flash back.
  if (disc) disc.style.transform = rotate(e.angle);
  e.cruise.cancel();
  e.cruise = null;
}

// Steady 33⅓ runs as a WAAPI animation on the compositor, so the disc keeps
// turning smoothly even when the main thread is busy.
function startCruise(e: Engine, disc: HTMLElement | null) {
  if (e.cruise || e.reduced || !disc || typeof disc.animate !== "function") return;
  e.angle %= 360;
  e.cruiseAngle = e.angle;
  e.cruise = disc.animate(
    [
      { transform: `rotate(${e.angle}deg)` },
      { transform: `rotate(${e.angle + 360}deg)` },
    ],
    { duration: CRUISE_MS, iterations: Number.POSITIVE_INFINITY },
  );
  if (!e.visible) e.cruise.pause();
}

// The disc's own speed: it relaxes toward cruise (playing) or zero (paused).
// Track time is not advanced here — the audio element owns that.
function integrateDisc(e: Engine, dt: number, disc: HTMLElement | null) {
  const target = e.playing ? CRUISE : 0;
  if (e.reduced) {
    e.omega = target;
    return;
  }
  if (e.cruise) {
    e.omega = CRUISE;
    return;
  }
  let tau = SPIN_UP_TAU;
  if (Math.abs(e.omega) > Math.abs(target)) {
    tau = e.playing ? COAST_TAU : SPIN_DOWN_TAU;
  }
  e.omega = target + (e.omega - target) * Math.exp(-dt / tau);
  if (Math.abs(e.omega - target) < SETTLE_EPSILON) e.omega = target;
  e.angle += e.omega * dt;
  if (e.playing && e.omega === CRUISE) startCruise(e, disc);
}

function meterTarget(e: Engine) {
  if (e.held) return clamp(Math.abs(e.scrubOmega) / CRUISE, 0, 1);
  return clamp(Math.abs(e.omega) / CRUISE, 0, 1);
}

function updateMeter(e: Engine, dt: number, bars: (HTMLElement | null)[]) {
  const target = meterTarget(e);
  if (e.reduced) {
    e.env = e.playing ? 1 : 0;
  } else if (target > e.env) {
    e.env = Math.min(target, e.env + dt / BAR_ATTACK_S);
  } else {
    // A linear fall: a full meter takes 300ms to come to rest.
    e.env = Math.max(target, e.env - dt / BAR_DECAY_S);
  }
  // Reduced motion shows one still frame of the meter.
  const t = e.reduced ? 0.37 : e.time;
  for (const [i, bar] of bars.entries()) {
    if (!bar) continue;
    const level = BAR_REST + (1 - BAR_REST) * barLevel(i, t) * e.env;
    bar.style.transform = `scaleY(${level.toFixed(3)})`;
  }
}

function rpmLabel(e: Engine) {
  if (e.held) return `${Math.round(e.scrubOmega / 6)} rpm`;
  if (e.omega === CRUISE) return "33⅓ rpm";
  return `${Math.round(e.omega / 6)} rpm`;
}

function paint(
  e: Engine,
  disc: HTMLElement | null,
  fill: HTMLElement | null,
  rpm: HTMLElement | null,
) {
  if (disc && !e.cruise) disc.style.transform = rotate(e.angle);
  if (fill) {
    const p = e.duration > 0 ? clamp(e.time / e.duration, 0, 1) : 0;
    fill.style.transform = `scaleX(${p.toFixed(4)})`;
  }
  const label = rpmLabel(e);
  if (rpm && rpm.textContent !== label) rpm.textContent = label;
}

/* -------------------------------------------------------------------------- */
/*  Rolling time                                                              */
/* -------------------------------------------------------------------------- */

function RollDigit({ value, direction }: { value: string; direction: 1 | -1 }) {
  const [state, setState] = React.useState<{
    current: string;
    previous: string | null;
    count: number;
    direction: 1 | -1;
  }>({ current: value, previous: null, count: 0, direction });

  // Derived during render: the old digit rolls out as the new one rolls in.
  if (state.current !== value) {
    setState({
      current: value,
      previous: state.current,
      count: state.count + 1,
      direction,
    });
  }

  const up = state.direction > 0;
  const timing = `${ROLL_MS}ms ${EASE_OUT} both`;

  return (
    <span className="relative inline-block h-[1lh] overflow-hidden">
      {state.previous !== null && (
        <span
          className="now-playing-roll now-playing-roll-prev absolute inset-0"
          key={`p${state.count}`}
          style={{
            animation: `${up ? "now-playing-out-up" : "now-playing-out-down"} ${timing}`,
          }}
        >
          {state.previous}
        </span>
      )}
      <span
        className="now-playing-roll block"
        key={`c${state.count}`}
        style={
          state.count > 0
            ? {
                animation: `${up ? "now-playing-in-up" : "now-playing-in-down"} ${timing}`,
              }
            : undefined
        }
      >
        {state.current}
      </span>
    </span>
  );
}

function RollingTime({ seconds, direction }: { seconds: number; direction: 1 | -1 }) {
  // Slots are counted from the right so the seconds keep their identity
  // when the minutes gain a digit.
  const chars = formatTime(seconds).split("").reverse();
  return (
    <span aria-hidden="true" className="inline-flex flex-row-reverse">
      {chars.map((char, slot) =>
        char === ":" ? (
          <span key="colon">:</span>
        ) : (
          <RollDigit
            direction={direction}
            key={`slot-${slot}`}
            value={char}
          />
        ),
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Artwork                                                                   */
/* -------------------------------------------------------------------------- */

const GROOVES = [28, 31, 34, 37, 40, 43, 46];

/** The record is the same in both themes: it is a physical object, not UI. */
function Disc({ artwork }: { artwork: string }) {
  const clipId = React.useId();
  return (
    <svg aria-hidden="true" className="size-full" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#14110e" />
      {GROOVES.map((r) => (
        <circle
          cx="50"
          cy="50"
          key={r}
          r={r}
          fill="none"
          stroke="#f4f0e6"
          strokeOpacity={0.08}
          strokeWidth={0.6}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="49"
        fill="none"
        stroke="#f4f0e6"
        strokeOpacity={0.16}
        strokeWidth={0.8}
      />
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="24" />
      </clipPath>
      <circle cx="50" cy="50" r="24" fill="#f4f0e6" />
      <image
        href={artwork}
        clipPath={`url(#${clipId})`}
        height="48"
        width="48"
        x="26"
        y="26"
      />
      <circle cx="50" cy="50" r="1.8" fill="#f4f0e6" />
    </svg>
  );
}

function Tonearm({ down }: { down: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-1 -right-4 h-[80%] w-auto origin-[77.5%_10%] transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
      style={{ transform: down ? "rotate(11deg)" : "rotate(-8deg)" }}
      viewBox="0 0 40 110"
    >
      <circle className="fill-rule stroke-muted" cx="31" cy="11" r="8" />
      <circle className="fill-muted" cx="31" cy="11" r="3" />
      <path
        className="fill-none stroke-muted"
        d="M31 11 L31 70 L18 92"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <rect
        className="fill-ink-soft"
        height="12"
        rx="1.5"
        transform="rotate(32 16 96)"
        width="7"
        x="12.5"
        y="90"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Now Playing                                                               */
/* -------------------------------------------------------------------------- */

const list = tracks;

export default function Player() {
  const [trackIndex, setTrackIndex] = React.useState(0);
  const track = list[trackIndex] ?? list[0]!;

  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(DEFAULT_VOLUME);
  const [clock, setClock] = React.useState<{ s: number; dir: 1 | -1 }>({
    s: 0,
    dir: 1,
  });
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  const engineRef = React.useRef<Engine | null>(null);
  if (engineRef.current === null) engineRef.current = createEngine(track.duration, false);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const discRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const volRef = React.useRef<HTMLDivElement>(null);
  const rpmRef = React.useRef<HTMLSpanElement>(null);
  const barRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const wakeRef = React.useRef<() => void>(() => undefined);
  const clockRef = React.useRef(0);
  const indexRef = React.useRef(trackIndex);
  const dragRef = React.useRef<{ id: number; dx: number; dy: number } | null>(null);
  const posRef = React.useRef<{ x: number; y: number } | null>(null);

  const duration = (audio: HTMLAudioElement | null, fallback: number) => {
    const d = audio?.duration;
    return typeof d === "number" && Number.isFinite(d) && d > 0 ? d : fallback;
  };

  const loadTrack = React.useCallback((index: number) => {
    const nextIndex = ((index % list.length) + list.length) % list.length;
    const e = engineRef.current;
    const audio = audioRef.current;
    if (e) {
      /* stopCruise first: it reads the live WAAPI angle back into e.angle, so
         zeroing before it would be overwritten and the disc would keep the
         angle it stopped at instead of returning to the top. */
      stopCruise(e, discRef.current);
      e.time = 0;
      e.duration = duration(audio, list[nextIndex]?.duration ?? 1);
      e.angle = 0;
      e.omega = 0;
    }
    if (audio) {
      audio.src = list[nextIndex]!.src;
      audio.load();
      if (e?.playing) {
        void audio.play().catch(() => {
          /* autoplay refused or the file would not decode: stop the deck
             instead of leaving a spinning disc behind a "paused" button */
          e.playing = false;
          setPlaying(false);
          stopCruise(e, discRef.current);
          wakeRef.current();
        });
      }
    }
    indexRef.current = nextIndex;
    setTrackIndex(nextIndex);
    wakeRef.current();
  }, []);

  /* ---- the loop: one rAF, asleep when nothing moves ---- */
  React.useEffect(() => {
    const e = engineRef.current;
    if (!e) return;

    const audio = document.getElementById("audio");
    audioRef.current = audio instanceof HTMLAudioElement ? audio : null;
    const media = audioRef.current;

    if (media) {
      /* `Number(null)` is 0, so an unset key has to be caught before it is
         coerced — otherwise every first visit would start silent. */
      const stored = readStore(VOL_KEY);
      const initial =
        stored === null ? DEFAULT_VOLUME : clamp(Number(stored) || 0, 0, 1);
      media.volume = initial;
      setVolume(initial);
      const savedMute = readStore(MUTE_KEY) === "1";
      media.muted = savedMute;
      setMuted(savedMute);
      media.src = list[0]!.src;
      media.load();
    }

    let raf = 0;
    let last = 0;

    const syncTime = () => {
      if (e.held || e.barDrag) return;
      if (media && Number.isFinite(media.currentTime)) e.time = media.currentTime;
      e.duration = duration(media, e.duration);
    };

    const render = () => {
      paint(e, discRef.current, fillRef.current, rpmRef.current);
      const s = Math.floor(e.time);
      if (s !== clockRef.current) {
        const dir = s > clockRef.current ? 1 : -1;
        clockRef.current = s;
        setClock({ s, dir });
      }
    };

    const handleEnds = () => {
      /* `ended` owns the advance: if the media has already ended, its event is
         queued and will call loadTrack itself. Advancing here too would skip a
         track whenever a frame happened to land between the two. */
      if (media?.ended) return;
      if (e.time >= e.duration && e.playing && !e.held && !e.barDrag) {
        loadTrack(indexRef.current + 1);
        return;
      }
      if (e.time < 0) e.time = 0;
    };

    const isAwake = () =>
      e.playing || e.held || e.barDrag || e.omega !== 0 || e.env > 0;

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 0;
      last = now;
      if (e.held) {
        e.scrubOmega *= Math.exp(-dt / HOLD_SETTLE_S);
      } else if (!e.barDrag) {
        integrateDisc(e, dt, discRef.current);
      }
      syncTime();
      handleEnds();
      updateMeter(e, dt, barRefs.current);
      render();
      if (isAwake() && e.visible) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        last = 0;
      }
    };

    const wake = () => {
      render();
      if (raf === 0 && e.visible) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;

    let inView = true;
    const sync = () => {
      e.visible = inView && !document.hidden;
      if (e.visible) {
        e.cruise?.play();
        wake();
      } else {
        e.cruise?.pause();
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      sync();
    });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", sync);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      e.reduced = motion.matches;
      if (e.reduced) stopCruise(e, discRef.current);
      wake();
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);

    /* ---- audio is the clock's source of truth ---- */
    const onPlay = () => {
      e.playing = true;
      setPlaying(true);
      wake();
    };
    const onPause = () => {
      // A pause that came from the audio itself, not from our own button.
      if (e.playing) {
        e.playing = false;
        setPlaying(false);
        stopCruise(e, discRef.current);
        wake();
      }
    };
    const onMeta = () => {
      e.duration = duration(media, e.duration);
      wake();
    };
    const onEnded = () => {
      if (e.held || e.barDrag) return;
      loadTrack(indexRef.current + 1);
    };
    media?.addEventListener("play", onPlay);
    media?.addEventListener("pause", onPause);
    media?.addEventListener("loadedmetadata", onMeta);
    media?.addEventListener("durationchange", onMeta);
    media?.addEventListener("ended", onEnded);

    wake();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", syncMotion);
      media?.removeEventListener("play", onPlay);
      media?.removeEventListener("pause", onPause);
      media?.removeEventListener("loadedmetadata", onMeta);
      media?.removeEventListener("durationchange", onMeta);
      media?.removeEventListener("ended", onEnded);
      e.cruise?.cancel();
      e.cruise = null;
    };
  }, [loadTrack]);

  /* ---- floating position ---- */
  const clampToViewport = (x: number, y: number) => {
    const root = rootRef.current;
    const w = root?.offsetWidth ?? 336;
    const h = root?.offsetHeight ?? 244;
    const pad = 8;
    return {
      x: Math.min(Math.max(x, pad), Math.max(pad, window.innerWidth - w - pad)),
      y: Math.min(Math.max(y, pad), Math.max(pad, window.innerHeight - h - pad)),
    };
  };

  const setPosition = (next: { x: number; y: number }) => {
    posRef.current = next;
    setPos(next);
  };

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const saved = readStore(POS_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved) as { x: number; y: number };
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
          setPosition(clampToViewport(p.x, p.y));
          return;
        }
      } catch {
        /* fall through to the default corner */
      }
    }

    // Default: lower-left, so the lamp at the top-right has the field to itself.
    setPosition(clampToViewport(16, window.innerHeight - root.offsetHeight - 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const onResize = () => {
      const current = posRef.current;
      if (current) setPosition(clampToViewport(current.x, current.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as Element | null;
    if (target?.closest("[data-no-drag]")) return;
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    dragRef.current = {
      id: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    root.setPointerCapture(event.pointerId);
    root.dataset.dragging = "true";
  };

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    setPosition(clampToViewport(event.clientX - drag.dx, event.clientY - drag.dy));
  };

  const onDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const root = rootRef.current;
    if (root) {
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
      delete root.dataset.dragging;
    }
    const current = posRef.current;
    if (current) writeStore(POS_KEY, JSON.stringify(current));
  };

  /* ---- transport ---- */
  const seekTo = (seconds: number) => {
    const e = engineRef.current;
    if (!e) return;
    const clamped = clamp(seconds, 0, e.duration);
    e.time = clamped;
    const audio = audioRef.current;
    if (audio && audio.readyState > 0) {
      try {
        audio.currentTime = clamped;
      } catch {
        /* not seekable yet */
      }
    }
    wakeRef.current();
  };

  const togglePlay = () => {
    const e = engineRef.current;
    const audio = audioRef.current;
    if (!e) return;
    const next = !e.playing;
    if (next && e.time >= e.duration - 0.05) {
      e.time = 0;
      if (audio) audio.currentTime = 0;
    }
    e.playing = next;
    if (next) {
      if (audio) {
        const attempt = audio.play();
        if (attempt) attempt.catch(() => {
          e.playing = false;
          setPlaying(false);
          /* the cruise is already running; without this the disc would keep
             turning under a "paused" deck forever (autoplay refused, no
             audio device, decode error) */
          stopCruise(e, discRef.current);
          wakeRef.current();
        });
      }
      startCruise(e, discRef.current);
    } else {
      audio?.pause();
      // Hand the disc back to the loop so it can spin down.
      stopCruise(e, discRef.current);
    }
    setPlaying(next);
    wakeRef.current();
  };

  const previous = () => {
    const e = engineRef.current;
    if (e && e.time > RESTART_THRESHOLD) {
      seekTo(0);
      return;
    }
    loadTrack(indexRef.current - 1);
  };

  const next = () => loadTrack(indexRef.current + 1);

  const toggleMute = () => {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    if (audio) {
      audio.muted = next;
      if (!next && audio.volume === 0) {
        /* unmuting a deck at zero is a silent no-op: restore an audible level */
        audio.volume = DEFAULT_VOLUME;
        setVolume(DEFAULT_VOLUME);
        writeStore(VOL_KEY, String(DEFAULT_VOLUME));
      }
    }
    writeStore(MUTE_KEY, next ? "1" : "0");
  };

  /* ---- volume ---- */
  const applyVolume = (value: number) => {
    const v = clamp(value, 0, 1);
    setVolume(v);
    writeStore(VOL_KEY, String(v));
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v;
    /* a level above silence is an explicit unmute */
    if (v > 0 && audio.muted) {
      audio.muted = false;
      setMuted(false);
      writeStore(MUTE_KEY, "0");
    }
  };

  const volumeFromPointer = (clientX: number) => {
    const rail = volRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    if (rect.width > 0) applyVolume((clientX - rect.left) / rect.width);
  };

  const onVolDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e || event.button !== 0 || e.pointerId !== null) return;
    e.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    e.volDrag = true;
    volumeFromPointer(event.clientX);
  };

  const onVolMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (e?.volDrag && e.pointerId === event.pointerId) volumeFromPointer(event.clientX);
  };

  const onVolUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e?.volDrag || e.pointerId !== event.pointerId) return;
    e.pointerId = null;
    e.volDrag = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onVolKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.05;
    const targets: Record<string, number> = {
      ArrowRight: volume + step,
      ArrowUp: volume + step,
      ArrowLeft: volume - step,
      ArrowDown: volume - step,
      Home: 0,
      End: 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    applyVolume(target);
  };

  /* ---- disc scrubbing ---- */
  const pointerAngle = (e: Engine, clientX: number, clientY: number) => {
    const dx = clientX - e.center.x;
    const dy = clientY - e.center.y;
    return {
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      distance: Math.hypot(dx, dy),
    };
  };

  const onDiscDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e || event.button !== 0 || e.pointerId !== null) return;
    e.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    e.center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    // A finger on the record stops it dead, cruise animation included.
    stopCruise(e, discRef.current);
    e.held = true;
    e.omega = 0;
    e.scrubOmega = 0;
    e.pointerAngle = pointerAngle(e, event.clientX, event.clientY).angle;
    e.lastMoveAt = performance.now();
    e.samples = [{ t: e.lastMoveAt, a: e.angle }];
    wakeRef.current();
  };

  const onDiscMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e?.held || e.pointerId !== event.pointerId) return;
    const { angle, distance } = pointerAngle(e, event.clientX, event.clientY);
    if (distance < DEAD_ZONE) {
      e.pointerAngle = angle;
      return;
    }
    // Unwrap across the ±180° seam.
    let delta = angle - e.pointerAngle;
    delta -= Math.round(delta / 360) * 360;
    e.pointerAngle = angle;

    const now = performance.now();
    const dt = Math.max(now - e.lastMoveAt, 1) / 1000;
    e.lastMoveAt = now;
    const instant = clamp(delta / dt, -MAX_OMEGA, MAX_OMEGA);
    e.scrubOmega += (instant - e.scrubOmega) * 0.35;

    // Track time follows the angle; faster turns cover more of the song.
    e.angle += delta;
    e.time = clamp(
      e.time + (delta / CRUISE) * scrubGain(e.scrubOmega),
      0,
      e.duration,
    );
    const audio = audioRef.current;
    if (audio && audio.readyState > 0) {
      try {
        audio.currentTime = e.time;
      } catch {
        /* not seekable yet */
      }
    }

    e.samples.push({ t: now, a: e.angle });
    while (e.samples.length > 2 && now - (e.samples[0]?.t ?? now) > VELOCITY_WINDOW_MS) {
      e.samples.shift();
    }
    if (discRef.current) discRef.current.style.transform = rotate(e.angle);
  };

  const onDiscUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e?.held || e.pointerId !== event.pointerId) return;
    e.pointerId = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    e.held = false;
    const now = performance.now();
    const first = e.samples[0];
    let velocity = 0;
    if (first && now - e.lastMoveAt < STALE_MOVE_MS && now > first.t) {
      velocity = ((e.angle - first.a) / (now - first.t)) * 1000;
    }
    // It keeps the spin you gave it, then eases back to cruise.
    e.omega = e.reduced ? 0 : clamp(velocity, -MAX_OMEGA, MAX_OMEGA);
    e.scrubOmega = 0;
    wakeRef.current();
  };

  /* ---- scrubber bar ---- */
  const seekFromPointer = (clientX: number) => {
    const e = engineRef.current;
    const rail = railRef.current;
    if (!(e && rail?.parentElement)) return;
    // The rail stretches, so measure its parent, which never moves.
    const rect = rail.parentElement.getBoundingClientRect();
    const x = clientX - rect.left;
    seekTo((x / rect.width) * e.duration);

    // Past either end the rail stretches toward the pointer and thins,
    // giving less the further you pull.
    let over = 0;
    if (x < 0) over = -damp(-x, RUBBER_MAX);
    else if (x > rect.width) over = damp(x - rect.width, RUBBER_MAX);
    const stretch = 1 + Math.abs(over) / rect.width;
    const thin = 1 - (0.35 * Math.abs(over)) / RUBBER_MAX;
    rail.style.transition = "none";
    rail.style.transformOrigin = over < 0 ? "right center" : "left center";
    rail.style.transform =
      over === 0 ? "" : `scale(${stretch.toFixed(4)}, ${thin.toFixed(3)})`;
  };

  const onBarDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e || event.button !== 0 || e.pointerId !== null) return;
    e.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    e.barDrag = true;
    seekFromPointer(event.clientX);
  };

  const onBarMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (e?.barDrag && e.pointerId === event.pointerId) seekFromPointer(event.clientX);
  };

  const onBarUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e?.barDrag || e.pointerId !== event.pointerId) return;
    e.pointerId = null;
    e.barDrag = false;
    const rail = railRef.current;
    if (rail) {
      rail.style.transition = RUBBER_RETURN;
      rail.style.transform = "";
    }
    wakeRef.current();
  };

  const onBarKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const e = engineRef.current;
    if (!e) return;
    const targets: Record<string, number> = {
      ArrowRight: e.time + SEEK_STEP,
      ArrowUp: e.time + SEEK_STEP,
      ArrowLeft: e.time - SEEK_STEP,
      ArrowDown: e.time - SEEK_STEP,
        Home: 0,
        End: e.duration,
      };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    seekTo(target);
  };

  const style = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { left: "1rem", bottom: "1rem", right: "auto", top: "auto" };

  return (
    <>
      <style>{ROLL_KEYFRAMES}</style>
      <Card
        ref={rootRef}
        data-player=""
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        style={style}
        className="fixed z-[60] w-[21rem] max-w-[calc(100vw-2rem)] cursor-grab touch-none p-4 select-none data-[dragging=true]:cursor-grabbing max-xs:w-[17.5rem] max-xs:p-3"
      >
        <div className="flex items-center gap-4 max-xs:gap-3">
          <div className="relative size-28 shrink-0 max-xs:size-20">
            <div
              className="size-full cursor-grab touch-none rounded-full shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)] active:cursor-grabbing"
              data-no-drag=""
              data-now-playing-disc=""
              onLostPointerCapture={onDiscUp}
              onPointerCancel={onDiscUp}
              onPointerDown={onDiscDown}
              onPointerMove={onDiscMove}
              onPointerUp={onDiscUp}
              ref={discRef}
              title="Spin to scrub"
            >
              <Disc artwork={track.artwork} />
            </div>
            <Tonearm down={playing} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-3.5 items-end gap-0.5">
                {Array.from({ length: BAR_COUNT }, (_, i) => (
                  <span
                    className="h-full w-[3px] origin-bottom rounded-[1px] bg-accent"
                    // a fixed set of bars, so the index is stable
                    key={i}
                    ref={(node) => {
                      barRefs.current[i] = node;
                    }}
                    style={{ transform: `scaleY(${BAR_REST})` }}
                  />
                ))}
              </span>
              <span className="font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">
                <DetentText>
                  {playing ? "Playing" : clock.s > 0 ? "Paused" : "Ready"}
                </DetentText>
              </span>
              <button
                aria-label={muted ? "Unmute" : "Mute"}
                className="ml-auto text-muted transition-colors duration-150 hover:text-ink"
                data-no-drag=""
                onClick={toggleMute}
                type="button"
              >
                {muted ? (
                  <VolumeX aria-hidden="true" className="size-4" />
                ) : (
                  <Volume2 aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            {/* Auto-advance changes the deck under the listener; announce the new
                record once, not every second. */}
            <div aria-live="polite" aria-atomic="true">
              <h2 className="mt-2 truncate font-serif text-[1.05rem] leading-tight">
                <DetentText>{track.title}</DetentText>
              </h2>
              <p className="truncate text-[0.8rem] text-muted">{track.artist}</p>
            </div>
            <span
              className="mt-1.5 inline-block font-mono text-[0.62rem] text-muted tabular-nums"
              ref={rpmRef}
            >
              0 rpm
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div
            aria-label="Seek"
            aria-valuemax={track.duration}
            aria-valuemin={0}
            aria-valuenow={clock.s}
            aria-valuetext={`${formatTime(clock.s)} of ${formatTime(track.duration)}`}
            className="group/seek -my-2 cursor-pointer touch-none py-2 outline-none"
            data-no-drag=""
            onKeyDown={onBarKey}
            onLostPointerCapture={onBarUp}
            onPointerCancel={onBarUp}
            onPointerDown={onBarDown}
            onPointerMove={onBarMove}
            onPointerUp={onBarUp}
            role="slider"
            tabIndex={0}
          >
            <div className="h-1.5">
              <div
                className="h-full overflow-hidden rounded-full bg-rule ring-accent ring-offset-2 ring-offset-paper group-focus-visible/seek:ring-2"
                ref={railRef}
              >
                <div
                  className="h-full w-full origin-left bg-accent"
                  ref={fillRef}
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[0.62rem] text-muted tabular-nums">
            <RollingTime direction={clock.dir} seconds={clock.s} />
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2" data-no-drag="">
          <Button
            aria-label="Previous track"
            onClick={previous}
            size="icon"
            variant="ghost"
          >
            <SkipBack aria-hidden="true" className="size-4" fill="currentColor" />
          </Button>
          <Button
            aria-label={playing ? "Pause" : "Play"}
            className="size-10"
            onClick={togglePlay}
            size="icon"
          >
            {playing ? (
              <Pause aria-hidden="true" className="size-4" fill="currentColor" />
            ) : (
              <Play aria-hidden="true" className="size-4 translate-x-px" fill="currentColor" />
            )}
          </Button>
          <Button aria-label="Next track" onClick={next} size="icon" variant="ghost">
            <SkipForward aria-hidden="true" className="size-4" fill="currentColor" />
          </Button>
        </div>

        <div
          aria-label="Volume"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(volume * 100)}
          aria-valuetext={muted ? "muted" : `${Math.round(volume * 100)}%`}
          className="-my-1.5 cursor-pointer touch-none py-1.5 outline-none focus-visible:outline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          data-no-drag=""
          onKeyDown={onVolKey}
          onLostPointerCapture={onVolUp}
          onPointerCancel={onVolUp}
          onPointerDown={onVolDown}
          onPointerMove={onVolMove}
          onPointerUp={onVolUp}
          role="slider"
          tabIndex={0}
        >
          <div className="h-0.5 overflow-hidden rounded-full bg-rule" ref={volRef}>
            <div
              className="h-full w-full origin-left bg-muted"
              style={{ transform: `scaleX(${muted ? 0 : volume})` }}
            />
          </div>
        </div>
      </Card>
    </>
  );
}