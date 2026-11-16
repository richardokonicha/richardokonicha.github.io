const STEPS: Record<string, number> = {
  "0.5": 4,
  "1": 10,
  "5": 50,
  "10": 100,
};

const INK = "#14110e";
const PAPER = "#f4f0e6";

/**
 * antfu/009 — a particle that never repeats itself.
 * Each frame nudges a random walk; the path accumulates into a cloud.
 */
export function initField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  /* an opaque 2d context starts out black, so lay the paper down first —
     otherwise the field reads as a black rectangle until the first reset */
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, size, size);

  let speed = "1";
  let x = 0;
  let y = 0;
  let frame = 0;
  let running = false;

  /* Read once and honoured everywhere: under reduced motion the field is a
     still drawing, not an animation. The observer below would otherwise call
     start() the moment the canvas scrolls into view and undo it. */
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const speedGroup = document.querySelector<HTMLElement>("[data-speed-group]");
  const speedButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-speed]"),
  );
  const restart = document.querySelector<HTMLButtonElement>(
    '[data-action="restart"]',
  );

  function paint() {
    ctx!.fillStyle = INK;
    const steps = STEPS[speed] ?? 10;
    for (let i = 0; i < steps; i += 1) {
      x += (Math.random() - 0.5) * 8;
      y += (Math.random() - 0.5) * 8;
      const px = Math.round(cx + x);
      const py = Math.round(cy - y);
      if (px >= 0 && px < size && py >= 0 && py < size) {
        ctx!.fillRect(px, py, 1, 1);
      }
    }
  }

  function tick() {
    if (!running) return;
    paint();
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (running || still) return;
    running = true;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  function reset() {
    stop();
    ctx!.fillStyle = PAPER;
    ctx!.fillRect(0, 0, size, size);
    x = 0;
    y = 0;
  }

  /** Wipe and draw the whole cloud at once — the still version of `reset`+`start`. */
  function settle() {
    reset();
    for (let i = 0; i < 6000; i += 1) paint();
  }

  /** Restart is the same gesture either way; only the motion differs. */
  function restartField() {
    if (still) settle();
    else {
      reset();
      start();
    }
  }

  speedGroup?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-speed]",
    );
    if (!button) return;
    speed = button.dataset.speed ?? "1";
    speedButtons.forEach((item) => {
      const active = item === button;
      item.dataset.active = String(active);
      item.setAttribute("aria-pressed", String(active));
    });
    if (still) settle();
  });

  restart?.addEventListener("click", () => {
    restartField();
  });

  canvas.addEventListener("click", () => {
    restartField();
  });

  if (still) {
    /* no observer, no rAF: the drawing is the finished state */
    settle();
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(canvas);
  } else {
    start();
  }
}