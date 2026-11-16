/**
 * Layout and chrome: every viewport, both themes, reduced motion, the nav.
 *
 * The site has no unit tests; this is the regression net for anything that
 * moves, floats or remembers state.
 */

import { Harness, reporter, sleep } from "./lib.mjs";

const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["laptop", 1280, 800],
  ["tablet", 768, 1024],
  ["phone", 390, 844],
];

const PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const sw = q('[role=switch]');
  const widget = sw?.parentElement;
  const card = q('[data-now-playing-disc]')?.closest('.fixed');
  const wr = widget?.getBoundingClientRect();
  const cr = card?.getBoundingClientRect();
  const bead = q('.bead')?.getBoundingClientRect();
  const logWheel = q('[role=listbox][aria-label="Filter the log by year"]')?.getBoundingClientRect();
  const overlap = wr && cr
    ? !(cr.x > wr.right || cr.right < wr.x || cr.y > wr.bottom || cr.bottom < wr.y)
    : null;
  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    revealIn: document.querySelectorAll('.reveal[data-in=true]').length,
    revealTotal: document.querySelectorAll('.reveal').length,
    theme: document.documentElement.dataset.theme ?? 'light',
    bodyBg: getComputedStyle(document.body).backgroundColor,
    cord: wr ? { x: Math.round(wr.x), y: Math.round(wr.y), r: Math.round(wr.right), b: Math.round(wr.bottom) } : null,
    cordInside: wr ? wr.x >= -0.5 && wr.y >= -0.5 && wr.right <= innerWidth + 0.5 : null,
    beadInside: bead && wr
      ? bead.left >= wr.left - 1 && bead.right <= wr.right + 1
        && bead.top >= wr.top - 24 && bead.bottom <= wr.bottom + 24
      : null,
    checked: sw?.getAttribute('aria-checked'),
    player: cr ? { x: Math.round(cr.x), y: Math.round(cr.y), r: Math.round(cr.right), b: Math.round(cr.bottom) } : null,
    playerInside: cr
      ? cr.x >= -0.5 && cr.y >= -0.5 && cr.right <= innerWidth + 0.5 && cr.bottom <= innerHeight + 0.5
      : null,
    logWheel: logWheel ? { x: Math.round(logWheel.x), r: Math.round(logWheel.right), w: Math.round(logWheel.width) } : null,
    logWheelInside: logWheel ? logWheel.x >= -0.5 && logWheel.right <= innerWidth + 0.5 : null,
    overlap,
    navToggle: q('[data-nav-toggle]') ? getComputedStyle(q('[data-nav-toggle]')).display : null,
  };
})()`;

export async function main() {
  const t = reporter();
  const h = await Harness.open({ reducedMotion: "no-preference" });
  const { check } = t;

  try {
    /* the theme is remembered on purpose, so a run must not inherit one */
    await h.goto("/");
    await h.clearStore();

    for (const [name, width, height] of VIEWPORTS) {
      await h.setReducedMotion("no-preference");
      await h.setViewport(width, height);
      await h.goto("/");
      await h.scrollThrough();
      const p = await h.ev(PROBE);
      const tag = `${name} ${width}x${height}`;

      check(`${tag}: no horizontal overflow`, p.overflowX === 0, `overflowX=${p.overflowX}`);
      check(
        `${tag}: reveals in`,
        p.revealIn === p.revealTotal && p.revealTotal > 0,
        `${p.revealIn}/${p.revealTotal}`,
      );
      check(`${tag}: pull cord on screen`, p.cordInside === true, JSON.stringify(p.cord));
      check(`${tag}: bead inside the cord`, p.beadInside === true);
      check(
        `${tag}: switch agrees with theme`,
        p.checked === String(p.theme === "light"),
        `checked=${p.checked} theme=${p.theme}`,
      );
      check(`${tag}: player on screen`, p.playerInside === true, JSON.stringify(p.player));
      check(`${tag}: year drum on screen`, p.logWheelInside === true, JSON.stringify(p.logWheel));
      check(`${tag}: no cord/player overlap`, p.overlap === false);
      check(`${tag}: no console errors`, h.logs.length === 0, h.logs.slice(0, 3).join(" | "));

      if (name === "desktop" || name === "phone") {
        const before = p.theme;
        await h.click("[role=switch]");
        await sleep(1200);
        const d = await h.ev(PROBE);
        const expected = before === "dark" ? "light" : "dark";
        const bg = expected === "dark" ? "rgb(18, 16, 13)" : "rgb(244, 240, 230)";
        check(`${tag}: cord flips to ${expected}`, d.theme === expected, `theme=${d.theme}`);
        check(`${tag}: body follows`, d.bodyBg === bg, d.bodyBg);
        check(`${tag}: still no overflow`, d.overflowX === 0);
        await h.click("[role=switch]");
        await sleep(900);
      }
    }

    /* the field is a background: it has to answer the pointer without ever
       taking one from the copy above it. */
    await h.setViewport(1440, 900);
    await h.goto("/");
    await h.clearStore();
    await h.ev("window.scrollTo(0,0)");
    await sleep(900);

    const painted = () =>
      h.ev(
        `(()=>{const c=document.getElementById('field');` +
          `const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;` +
          `let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>0)n++;return n})()`,
      );
    const still0 = await painted();
    await sleep(600);
    const still1 = await painted();
    check("the field sleeps while the pointer is still", still0 === still1, `${still0}`);

    for (let i = 0; i < 14; i += 1) {
      await h.mouse("mouseMoved", { x: 420 + i * 26, y: 520 + Math.sin(i / 2) * 90 }, 1);
      await sleep(45);
    }
    await sleep(500);
    const stirred = await painted();
    check("a pointer sweep paints the field", stirred > still0, `${still0} -> ${stirred}`);
    check(
      "the cover canvas takes no pointer",
      await h.ev(
        `getComputedStyle(document.getElementById('field')).pointerEvents === 'none'`,
      ),
    );

    /* the volume rail takes a pointer as well as keys */
    await h.setViewport(1440, 900);
    await h.goto("/");
    await h.clearStore();
    const rail = await h.ev(
      `(()=>{const n=document.querySelector('[aria-label=Volume] > div');` +
        `const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`,
    );
    const at = { x: rail.x + rail.w * 0.25, y: rail.y + rail.h / 2 };
    await h.mouse("mousePressed", at);
    await h.mouse("mouseReleased", at);
    const level = await h.ev(
      `Number(document.querySelector('[aria-label=Volume]').getAttribute('aria-valuenow'))`,
    );
    check("volume rail takes a pointer", Math.abs(level - 25) <= 1, `${level}%`);
    check(
      "the deck follows the pointer",
      Math.abs((await h.ev("document.getElementById('audio').volume")) - 0.25) < 0.02,
    );

    /* reduced motion: no idle pull, and the disc is a still object */
    await h.setReducedMotion("reduce");
    await h.setViewport(1440, 900);
    await h.ev(`(()=>{try{localStorage.removeItem('ro-theme');localStorage.removeItem('ro-player-pos')}catch(e){};return 1})()`);
    await h.goto("/");
    await sleep(6000);
    const rm = await h.ev(PROBE);
    check(
      "reduced motion: no idle auto-pull",
      rm.theme === "light" && rm.checked === "true",
      `theme=${rm.theme}`,
    );

    await h.click("[aria-label=Play]");
    await sleep(3200);
    const rmPlay = await h.ev(
      `(()=>{const a=document.getElementById('audio');` +
        `const d=document.querySelector('[data-now-playing-disc]');` +
        `return {paused:a.paused,t:+a.currentTime.toFixed(2),anim:d.getAnimations().length}})()`,
    );
    check(
      "reduced motion: audio plays, disc holds still",
      rmPlay.paused === false && rmPlay.anim === 0,
      JSON.stringify(rmPlay),
    );
    await h.click("[aria-label=Pause]");

    /* the cover's field must be a still frame for those same visitors */
    await h.ev("window.scrollTo(0,0)");
    await sleep(1200);
    const fieldStill = `(()=>{const c=document.getElementById('field');` +
      `const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;` +
      `let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>0)n++;` +
      `return {painted:n,w:c.width,h:c.height}})()`;
    const fieldA = await h.ev(fieldStill);
    await sleep(1500);
    const fieldB = await h.ev(fieldStill);
    check(
      "reduced motion: the cover field is a finished drawing",
      fieldA.painted > 0 && fieldA.painted === fieldB.painted,
      JSON.stringify(fieldA),
    );
    check(
      "reduced motion: the canvas covers the hero",
      fieldA.w >= 1000 && fieldA.h >= 700,
      `${fieldA.w}x${fieldA.h}`,
    );

    /* mobile nav */
    await h.setReducedMotion("no-preference");
    await h.setViewport(390, 844);
    await h.goto("/");
    await h.click("[data-nav-toggle]");
    await sleep(400);
    const navOpen = await h.ev(
      `(()=>{const m=document.querySelector('[data-nav-menu]');` +
        `return m?{display:getComputedStyle(m).display,h:Math.round(m.getBoundingClientRect().height)}:null})()`,
    );
    check(
      "phone: nav opens",
      navOpen && navOpen.display !== "none" && navOpen.h > 0,
      JSON.stringify(navOpen),
    );
    await h.key("Escape", "Escape", 27);
    await sleep(400);
    const navClosed = await h.ev(
      `(()=>{const m=document.querySelector('[data-nav-menu]');` +
        `return m?getComputedStyle(m).display:null})()`,
    );
    check("phone: Escape closes nav", navClosed === "none", String(navClosed));
  } finally {
    await h.close();
  }

  return t.summary();
}