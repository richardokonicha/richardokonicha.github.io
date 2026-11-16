/**
 * Motion: the idle tug must never flip the theme, and both requestAnimationFrame
 * loops must actually go to sleep.
 */

import { Harness, reporter, sleep } from "./lib.mjs";

const RAF_COUNTER = `
  window.__raf = 0;
  (function () {
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      return orig(function (t) { window.__raf++; return cb(t); });
    };
  })();
`;

const BEAD = `(()=>{const b=document.querySelector('.bead');const r=b.getBoundingClientRect();
  const w=document.querySelector('[role=switch]').parentElement.getBoundingClientRect();
  return {theme:document.documentElement.dataset.theme??'light',
    checked:document.querySelector('[role=switch]').getAttribute('aria-checked'),
    bead:{x:+r.x.toFixed(1),y:+r.y.toFixed(1)},
    widget:{x:+w.x.toFixed(1),y:+w.y.toFixed(1)}}})()`;

async function idleSuite(t) {
  const { check } = t;
  const h = await Harness.open({ reducedMotion: "no-preference" });
  try {
    await h.goto("/");
    await h.clearStore();

    let flips = 0;
    let last = await h.ev(BEAD);
    for (let i = 0; i < 32; i += 1) {
      await sleep(500);
      const now = await h.ev(BEAD);
      if (now.theme !== last.theme) {
        flips += 1;
        console.log(`  theme changed at ${(i * 0.5).toFixed(1)}s -> ${now.theme}`);
      }
      last = now;
    }
    const after = await h.ev(BEAD);
    check("idle 16s: the tug never flips the theme", flips === 0, `flips=${flips}`);

    /* a real pull must still flip */
    const b = after;
    await h.mouse("mousePressed", { x: b.bead.x, y: b.bead.y });
    for (let i = 1; i <= 14; i += 1) {
      await h.mouse("mouseMoved", { x: b.bead.x, y: b.bead.y + i * 4 }, 1);
      await sleep(35);
    }
    await sleep(300);
    await h.mouse("mouseReleased", { x: b.bead.x, y: b.bead.y + 56 });
    await sleep(1600);
    const pulled = await h.ev(BEAD);
    check(
      "a real pull still flips to dark",
      pulled.theme === "dark" && pulled.checked === "false",
      `theme=${pulled.theme} checked=${pulled.checked}`,
    );
    check("no console errors", h.logs.length === 0, h.logs.slice(0, 3).join(" | "));
  } finally {
    await h.close();
  }
}

async function sleepSuite(t) {
  const { check } = t;
  const h = await Harness.open({ reducedMotion: "no-preference", scripts: [RAF_COUNTER] });
  try {
    await h.goto("/");
    await h.clearStore();

    /* settle well before the first idle tug at 11s */
    await sleep(4000);
    const a = await h.ev("window.__raf");
    await sleep(2000);
    const b = await h.ev("window.__raf");
    check("idle 2s: every rAF loop is asleep", b - a === 0, `${b - a} callbacks`);

    const beadA = await h.ev("document.querySelector('.bead').style.transform");
    await sleep(900);
    const beadB = await h.ev("document.querySelector('.bead').style.transform");
    check("the bead holds still while idle", beadA === beadB, beadA);

    const r = await h.ev(
      `(()=>{const b=document.querySelector('.bead').getBoundingClientRect();
        return {x:b.x+8,y:b.y+13}})()`,
    );
    await h.mouse("mousePressed", r);
    const c1 = await h.ev("window.__raf");
    for (let i = 1; i <= 10; i += 1) {
      await h.mouse("mouseMoved", { x: r.x + i * 2, y: r.y + i * 3 }, 1);
      await sleep(25);
    }
    const c2 = await h.ev("window.__raf");
    await h.mouse("mouseReleased", { x: r.x + 20, y: r.y + 30 });
    check("a drag wakes the loop", c2 - c1 > 0, `${c2 - c1} callbacks`);

    await sleep(3500);
    const c3 = await h.ev("window.__raf");
    await sleep(1500);
    const c4 = await h.ev("window.__raf");
    check("it goes back to sleep once settled", c4 - c3 === 0, `${c4 - c3} callbacks`);
  } finally {
    await h.close();
  }
}

export async function main() {
  const t = reporter();
  console.log("-- idle tug --");
  await idleSuite(t);
  console.log("\n-- sleeping loop --");
  await sleepSuite(t);
  return t.summary();
}