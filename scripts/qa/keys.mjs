/**
 * Keyboard: the seek and volume sliders, the tab order, and the scroll spy.
 *
 * Everything interactive has to work without a pointer, and the spy has to
 * clear as well as set.
 */

import { Harness, reporter, sleep } from "./lib.mjs";

const KEYS = {
  Tab: ["Tab", "Tab", 9],
  Escape: ["Escape", "Escape", 27],
  Home: ["Home", "Home", 36],
  End: ["End", "End", 35],
  ArrowLeft: ["ArrowLeft", "ArrowLeft", 37],
  ArrowUp: ["ArrowUp", "ArrowUp", 38],
  ArrowRight: ["ArrowRight", "ArrowRight", 39],
  ArrowDown: ["ArrowDown", "ArrowDown", 40],
};

export async function main() {
  const t = reporter();
  const { check } = t;
  const h = await Harness.open({ reducedMotion: "reduce" });

  try {
    await h.goto("/");
    await h.clearStore();

    const press = async (name) => {
      const [key, code, vk] = KEYS[name];
      await h.key(key, code, vk);
      await sleep(260);
    };

    /* ---- seek ---- */
    const seek = '[aria-label=Seek]';
    const time = () => h.ev("document.getElementById('audio').currentTime");
    const start = await time();
    await h.ev(`document.querySelector(${JSON.stringify(seek)}).focus()`);
    check(
      "seek slider takes focus",
      (await h.ev("document.activeElement.getAttribute('aria-label')")) === "Seek",
    );

    await press("ArrowRight");
    const plus5 = await time();
    check("ArrowRight seeks +5s", Math.abs(plus5 - start - 5) < 0.2, `${start} -> ${plus5}`);

    await press("End");
    const end = await time();
    check("End seeks to the end", Math.abs(end - 48) < 0.2, `${end}`);

    await press("Home");
    const home = await time();
    check("Home seeks to zero", home < 0.2, `${home}`);

    /* ---- volume ---- */
    const vol = '[aria-label=Volume]';
    const level = () =>
      h.ev(`Number(document.querySelector(${JSON.stringify(vol)}).getAttribute('aria-valuenow'))`);
    const before = await level();
    await h.ev(`document.querySelector(${JSON.stringify(vol)}).focus()`);
    check(
      "volume slider takes focus",
      (await h.ev("document.activeElement.getAttribute('aria-label')")) === "Volume",
    );

    await press("End");
    const full = await level();
    check("End sets full volume", full === 100, `${before} -> ${full}`);

    await press("Home");
    const silent = await level();
    check("Home mutes to zero", silent === 0, `${full} -> ${silent}`);

    for (let i = 0; i < 4; i += 1) await press("ArrowRight");
    const back = await level();
    check("ArrowRight raises volume by 5", back === 20, `${silent} -> ${back}`);
    check(
      "the deck follows the level",
      Math.abs((await h.ev("document.getElementById('audio').volume")) - 0.2) < 0.001,
    );

    /* ---- tab order reaches the cord and the player ---- */
    await h.ev(`document.querySelector(${JSON.stringify(seek)}).focus()`);
    const seen = [];
    for (let i = 0; i < 26; i += 1) {
      await press("Tab");
      const label = await h.ev(
        `(()=>{const a=document.activeElement;if(!a)return null;` +
          `return (a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,24)})()`,
      );
      if (label) seen.push(label);
    }
    const unique = [...new Set(seen)];
    check("tab order reaches the volume slider", unique.includes("Volume"));
    check("tab order reaches the cord switch", unique.includes("Light mode"));
    check(
      "tab order reaches the transport",
      unique.some((label) => /Play|Pause|Previous|Next/.test(label)),
    );

    /* ---- scroll spy ---- */
    await h.setReducedMotion("reduce");
    const active = () =>
      h.ev(
        `[...document.querySelectorAll('[data-nav-link][data-active=true]')].map(e=>e.textContent).join(',')||'(none)'`,
      );
    const go = async (id) => {
      await h.ev(
        `(()=>{const e=document.getElementById('${id}');` +
          `window.scrollTo(0, e.offsetTop + e.offsetHeight/2 - 450)})()`,
      );
      await sleep(700);
      return active();
    };

    await h.ev("window.scrollTo(0,0)");
    await sleep(700);
    check("no link is active at the top", (await active()) === "(none)", await active());
    for (const id of ["log", "plates"]) {
      const label = id === "log" ? "Log" : "Plates";
      check(`#${id} marks ${label} active`, (await go(id)) === label, await active());
    }
    await h.ev("window.scrollTo(0,0)");
    await sleep(700);
    check(
      "leaving every section clears the active link",
      (await active()) === "(none)",
      await active(),
    );
    check("no console errors", h.logs.length === 0, h.logs.slice(0, 3).join(" | "));
  } finally {
    await h.close();
  }

  return t.summary();
}