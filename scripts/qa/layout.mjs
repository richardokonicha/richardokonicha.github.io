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

    /* the particle field must be a still frame for those same visitors */
    await h.ev(`document.getElementById('plates').scrollIntoView({block:'center'})`);
    await sleep(1500);
    const ink = `(()=>{const c=document.getElementById('field');` +
      `const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;` +
      `let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<100)n++;return n})()`;
    const inkA = await h.ev(ink);
    await sleep(1500);
    const inkB = await h.ev(ink);
    check(
      "reduced motion: particle field holds still",
      inkA === inkB && inkA > 0,
      `${inkA} -> ${inkB}`,
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