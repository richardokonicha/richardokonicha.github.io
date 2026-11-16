import { layoutWithLines, prepareWithSegments } from "../vendor/pretext.mjs";

const EASE = "cubic-bezier(0.16, 0.84, 0.24, 1)";
const STAGGER_MS = 70;
const STAGGER_CAP_MS = 420;
const DURATION_MS = 950;

const originals = new WeakMap<HTMLElement, string>();

function fontShorthand(el: HTMLElement) {
  const style = getComputedStyle(el);
  return `${style.fontStyle || "normal"} ${style.fontWeight || "400"} ${
    style.fontSize || "16px"
  } ${style.fontFamily || "sans-serif"}`;
}

/**
 * Replaces an element's text with one masked span per Pretext-laid-out line.
 * Pretext is pure arithmetic over the browser's font metrics — no DOM reads
 * inside the loop — so the measured line breaks match what the browser would
 * have produced anyway, but we can address each line individually.
 */
function split(el: HTMLElement, animate: boolean) {
  let text = originals.get(el);
  if (!text) {
    text = (el.textContent || "").trim();
    if (!text) return;
    originals.set(el, text);
  }

  const style = getComputedStyle(el);
  const size = Number.parseFloat(style.fontSize) || 16;
  const lineHeight = Number.parseFloat(style.lineHeight) || size * 1.2;
  const width = el.clientWidth;
  if (!width) return;

  let lines: readonly { text: string }[];
  try {
    const prepared = prepareWithSegments(text, fontShorthand(el));
    lines = layoutWithLines(prepared, width, lineHeight).lines;
  } catch (error) {
    console.warn("Pretext could not lay out a target", error);
    return;
  }

  const fragment = document.createDocumentFragment();
  const inners: HTMLSpanElement[] = [];

  lines.forEach((line) => {
    const mask = document.createElement("span");
    mask.className = "line-mask";

    const inner = document.createElement("span");
    inner.className = "line";
    inner.textContent = line.text;

    mask.appendChild(inner);
    fragment.appendChild(mask);
    inners.push(inner);
  });

  el.textContent = "";
  el.appendChild(fragment);
  el.classList.add("is-split");

  inners.forEach((inner, index) => {
    if (!animate) {
      inner.style.transform = "none";
      return;
    }

    inner.animate(
      [{ transform: "translateY(112%)" }, { transform: "none" }],
      {
        duration: DURATION_MS,
        delay: Math.min(index * STAGGER_MS, STAGGER_CAP_MS),
        easing: EASE,
        fill: "both",
      },
    );
  });
}

export function initPretextLines(root: ParentNode = document) {
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-pretext-lines]"),
  );
  if (!targets.length) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = (window as unknown as { __pretextState?: string });
  state.__pretextState = `init:${targets.length}`;

  const run = () => {
    if (reduced) {
      state.__pretextState = "skipped:reduced-motion";
      return;
    }
    state.__pretextState = `running:${targets.length}`;
    targets.forEach((el) => split(el, true));
    state.__pretextState = `done:${targets.length}`;
  };

  if (document.fonts) {
    Promise.allSettled([
      document.fonts.load('400 1em "Instrument Serif"'),
      document.fonts.load("400 1em Inter"),
    ])
      .then(() => document.fonts.ready)
      .then(run)
      .catch(run);
  } else {
    run();
  }

  let timer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (reduced) return;
        targets.forEach((el) => {
          if (el.classList.contains("is-split")) split(el, false);
        });
      }, 180);
    },
    { passive: true },
  );
}