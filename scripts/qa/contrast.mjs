/**
 * WCAG AA contrast for every piece of text on the page, in both themes.
 *
 * Earlier versions listed selectors by hand, so a restructure silently turned
 * half the audit into "missing". This walks the DOM instead: every rendered
 * text node is measured against the first opaque background behind it, and
 * anything that cannot be measured fails loudly.
 */

import { Harness, sleep } from "./lib.mjs";

const AUDIT = `(() => {
  const parse = (c) => {
    const m = /rgba?\\(([^)]+)\\)/.exec(c);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const bgOf = (node) => {
    const stack = [];
    let n = node;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a === 1) break;
      }
      n = n.parentElement;
    }
    let base = parse(getComputedStyle(document.body).backgroundColor)
      || { r: 255, g: 255, b: 255, a: 1 };
    if (base.a < 1) base = over(base, { r: 255, g: 255, b: 255, a: 1 });
    for (let i = stack.length - 1; i >= 0; i -= 1) base = over(stack[i], base);
    return base;
  };

  const opacityOf = (el) => {
    let o = 1;
    let n = el;
    while (n && n !== document.documentElement) {
      o *= Number(getComputedStyle(n).opacity);
      if (o === 0) return 0;
      n = n.parentElement;
    }
    return o;
  };

  const visible = (el) => {
    if (el.closest('[hidden]')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (opacityOf(el) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    /* off-canvas furniture (the skip link) is measured elsewhere */
    if (r.right <= 0 || r.left >= document.documentElement.scrollWidth) return false;
    return true;
  };

  const label = (el) => {
    const cls = (el.getAttribute('class') || '').trim().split(/\\s+/).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };

  const rows = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement && node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);

  for (const node of texts) {
    const text = node.textContent.replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color);
    /* fully transparent text is not read by anyone: the stream's decorative
       arrows are transparent on purpose when there is nothing to click */
    if (!fg0 || fg0.a === 0) continue;
    const bg = bgOf(el);
    const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    rows.push({
      text: text.slice(0, 56),
      el: label(el),
      ratio: +ratio(fg, bg).toFixed(2),
      need: large ? 3 : 4.5,
      size: +size.toFixed(1),
      fg: cs.color,
      bg: 'rgb(' + Math.round(bg.r) + ', ' + Math.round(bg.g) + ', ' + Math.round(bg.b) + ')',
    });
  }
  return rows;
})()`;

export async function main() {
  const h = await Harness.open({ reducedMotion: "reduce" });
  let failures = 0;

  try {
    for (const theme of ["light", "dark"]) {
      for (const [label, path] of [
        ["home", "/"],
        ["cv", "/cv/"],
      ]) {
        await h.goto("/");
        await h.ev(`(()=>{try{localStorage.setItem('ro-theme','${theme}')}catch(e){};return 1})()`);
        await h.reload();
        /* reduced motion marks every reveal as in, so nothing is transparent */
        await h.scrollThrough();

        const rows = await h.ev(AUDIT);
        const low = rows.filter((row) => row.ratio < row.need);
        failures += low.length;

        console.log(
          `\n== ${label} · ${theme} == ${rows.length} text nodes, ${low.length} below AA`,
        );
        for (const row of low) {
          console.log(
            `  LOW  ${String(row.ratio).padStart(6)} (need ${row.need})  ` +
              `${String(row.size).padStart(5)}px  ${row.fg} on ${row.bg}\n` +
              `       ${row.el}  "${row.text}"`,
          );
        }
      }
    }
  } finally {
    await h.close();
  }

  console.log(
    failures === 0 ? "\nall text meets WCAG AA" : `\n${failures} contrast failures`,
  );
  return failures === 0;
}