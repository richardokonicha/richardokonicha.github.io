interface QaReport {
  viewport: { width: number; height: number };
  overflowX: number;
  heroName: DOMRect | null;
  heroFontSize: string | null;
  nav: DOMRect | null;
  player: DOMRect | null;
  canvas: DOMRect | null;
  ditherCount: number;
  ditherLayer: string;
  splitTargets: number;
  pretextState: string | null;
  fonts: string;
  htmlClass: string;
  images: { src: string; loaded: boolean }[];
  errors: string[];
}

declare global {
  interface Window {
    __qaErrors?: string[];
  }
}

const params = new URLSearchParams(window.location.search);

if (params.get("qa") === "1") {
  window.__qaErrors = [];
  window.addEventListener("error", (event) => {
    window.__qaErrors!.push(String(event.message || event.error || "error"));
  });
  window.addEventListener("unhandledrejection", (event) => {
    window.__qaErrors!.push(String(event.reason || "rejection"));
  });

  const rect = (selector: string): DOMRect | null => {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect() : null;
  };

  const run = () => {
    const heroName = document.querySelector<HTMLElement>("[data-pretext-lines]");
    const dither = document.querySelector<HTMLElement>("[data-dither]");

    const report: QaReport = {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      overflowX:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      heroName: rect("[data-pretext-lines]"),
      heroFontSize: heroName ? getComputedStyle(heroName).fontSize : null,
      nav: rect("[data-nav]"),
      player: rect("#player"),
      canvas: rect("#field"),
      ditherCount: document.querySelectorAll("[data-dither]").length,
      ditherLayer: dither
        ? getComputedStyle(dither, "::after").backgroundImage.slice(0, 40)
        : "none",
      splitTargets: document.querySelectorAll(".is-split").length,
      pretextState:
        (window as unknown as { __pretextState?: string }).__pretextState ??
        null,
      fonts: document.fonts?.status ?? "unsupported",
      htmlClass: document.documentElement.className,
      images: Array.from(document.images).map((image) => ({
        src: image.currentSrc.split("/").pop() ?? "",
        loaded: image.complete && image.naturalWidth > 0,
      })),
      errors: window.__qaErrors ?? [],
    };

    const pre = document.createElement("pre");
    pre.id = "qa-output";
    pre.style.cssText = "position:fixed;left:-99999px;top:0";
    pre.textContent = JSON.stringify(report, null, 2);
    document.body.appendChild(pre);
  };

  if (document.readyState === "complete") {
    window.setTimeout(run, 1500);
  } else {
    window.addEventListener("load", () => window.setTimeout(run, 1500));
  }
}

export {};