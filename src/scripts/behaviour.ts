import { initField } from "./field";
import { initPretextLines } from "./pretext";

/* ------------------------------------------------------------------ *
 * chrome: year, mobile nav, scrolled state
 * ------------------------------------------------------------------ */

const year = document.querySelector<HTMLElement>("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const nav = document.querySelector<HTMLElement>("[data-nav]");
const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
const menu = document.querySelector<HTMLElement>("[data-nav-menu]");
const links = Array.from(
  document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"),
);

function setMenu(open: boolean) {
  if (toggle) {
    toggle.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  if (menu) menu.dataset.open = String(open);
}

toggle?.addEventListener("click", () => {
  setMenu(toggle.dataset.open !== "true");
});

menu?.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth >= 768) setMenu(false);
  },
  { passive: true },
);

const onScroll = () => {
  if (nav) nav.dataset.scrolled = String(window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ------------------------------------------------------------------ *
 * reveal on scroll + section spy
 * ------------------------------------------------------------------ */

const revealItems = Array.from(
  document.querySelectorAll<HTMLElement>(".reveal"),
);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.in = "true";
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => {
    item.dataset.in = "true";
  });
}

/* Only in-page anchors can be observed. The résumé link is a real route
   (/cv/), and querySelector would throw on it and take the rest of this
   module down with it. */
const sections = links
  .map((link) => link.getAttribute("href") ?? "")
  .filter((href) => href.startsWith("#") && href.length > 1)
  .map((href) => document.querySelector<HTMLElement>(href))
  .filter((section): section is HTMLElement => Boolean(section));

if ("IntersectionObserver" in window && sections.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          if (active) link.dataset.active = "true";
          else delete link.dataset.active;
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  sections.forEach((section) => spy.observe(section));
}

/* ------------------------------------------------------------------ *
 * experiments
 * ------------------------------------------------------------------ */

initPretextLines();

const field = document.getElementById("field");
if (field instanceof HTMLCanvasElement) initField(field);