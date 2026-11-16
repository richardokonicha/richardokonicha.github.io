export const site = {
  name: "Richard Okonicha",
  title: "Richard Okonicha — Engineer & Writer",
  description:
    "A log of things built, studied and noticed — software, type, generative sketches, and the occasional essay.",
  email: "richardokonicha@gmail.com",
  year: 2026,
  tagline: "A log of things built, studied and noticed.",
};

export const nav = [
  { label: "Log", href: "#log" },
  { label: "Plates", href: "#plates" },
  { label: "Colophon", href: "#colophon" },
  { label: "Résumé", href: "/cv/" },
] as const;

/* ------------------------------------------------------------------ *
 * The log — newest first. Adding a thing you made is one object here.
 * ------------------------------------------------------------------ */

export type EntryKind = "work" | "note";

export interface Entry {
  /** display date, newest first */
  date: string;
  kind: EntryKind;
  title: string;
  summary: string;
  /** omit for entries that live only here */
  href?: string;
}

export const entries: Entry[] = [
  {
    date: "2026",
    kind: "work",
    title: "Fugoku Cloud",
    summary:
      "Sovereign AI cloud on bare-metal OpenStack — compute fabric, tenant isolation, and an LLM gateway.",
  },
  {
    date: "2026",
    kind: "note",
    title: "Kubernetes on AMD GPUs with ROCm",
    summary: "ROCm, k3s, device plugins, and the failure modes nobody documents.",
  },
  {
    date: "2024–26",
    kind: "work",
    title: "InferenceCloud.ai",
    summary:
      "Multi-tenant AI writing platform for a Swiss team — queues, isolation, and a pipeline rebuilt for spikes.",
  },
  {
    date: "2022–24",
    kind: "work",
    title: "Swell",
    summary:
      "Storefront theme engine and origin theme for a high-scale enterprise SaaS platform.",
  },
  {
    date: "2020–22",
    kind: "work",
    title: "Cardagraph",
    summary:
      "Machine-learning pipelines forecasting software delivery timelines, and the APIs in front of them.",
  },
  {
    date: "2020",
    kind: "note",
    title: "Understanding Python: Your Baby Steps",
    summary:
      "What a programming language actually is, and why a computer is a very literal child.",
    href: "https://medium.com/@richardokonicha/understanding-python-your-baby-steps-a2949c17670e",
  },
  {
    date: "2018–20",
    kind: "work",
    title: "eHealth4Everyone",
    summary: "Health data systems for government clients — OpenHisa, MSDAT.",
  },
];

/* ------------------------------------------------------------------ *
 * Plates — the visual end of the log. Each renders differently.
 * ------------------------------------------------------------------ */

export type Plate =
  | {
      kind: "field";
      no: string;
      title: string;
      caption: string;
      formula: readonly string[];
    }
  | {
      kind: "image";
      no: string;
      title: string;
      caption: string;
      src: string;
      alt: string;
    }
  | {
      kind: "type";
      no: string;
      title: string;
      caption: string;
      quote: string;
    };

export const plates: Plate[] = [
  {
    kind: "field",
    no: "P·01",
    title: "Unreproducible",
    caption:
      "A particle that never repeats itself. Each frame, a random walk; the path accumulates into a cloud that cannot be reproduced.",
    formula: ["x = x + (random() − 0.5) × 8", "y = y + (random() − 0.5) × 8"],
  },
  {
    kind: "image",
    no: "P·02",
    title: "Ordered",
    caption:
      "A continuous image reduced to a grid of dots. Ordered Bayer dithering — no blur, no gradient, just threshold and repetition.",
    src: "/img/study-01.svg",
    alt: "Generative field study reduced to ordered dots",
  },
  {
    kind: "type",
    no: "P·03",
    title: "Set",
    caption:
      "Line-by-line composition measured with Pretext — the browser's own font engine, used without a single DOM read.",
    quote:
      "Typography is not the art of seeing the words. It is the art of making the space between them visible.",
  },
];

/* ------------------------------------------------------------------ *
 * Résumé — the long form, on its own page.
 * ------------------------------------------------------------------ */

export interface Role {
  period: string;
  role: string;
  company: string;
  summary: string;
  stack: string;
}

export const roles: Role[] = [
  {
    period: "2026",
    role: "Founder & Architect",
    company: "Fugoku Cloud",
    summary:
      "Sovereign AI cloud on bare-metal OpenStack: GPU/TPU compute fabric, tenant isolation, and an LLM gateway that cut inference latency from 300ms+ in Europe to under 50ms in-region.",
    stack: "OpenStack · K3s · Python · Go · Terraform",
  },
  {
    period: "2024–26",
    role: "Senior Infrastructure Engineer",
    company: "InferenceCloud.ai",
    summary:
      "Multi-tenant AI writing platform for a Swiss team. High-concurrency queues, tenant isolation, and a request pipeline rebuilt for enterprise traffic spikes.",
    stack: "Python · Docker · Cloud infrastructure",
  },
  {
    period: "2022–24",
    role: "Senior Engineer, Storefront",
    company: "Swell",
    summary:
      "Owned the storefront theme engine and origin theme for a high-scale enterprise SaaS platform. Stripe payments, checkout race conditions, and onboarding that went from days to under two hours.",
    stack: "Kubernetes · PostgreSQL · Redis · Vue · TypeScript · Node",
  },
  {
    period: "2020–22",
    role: "Senior Engineer & Architect",
    company: "Cardagraph",
    summary:
      "Built machine-learning pipelines forecasting software delivery timelines, and the APIs that put those forecasts in front of clients.",
    stack: "Python · React · Docker · PostgreSQL",
  },
  {
    period: "2018–20",
    role: "Technical Lead",
    company: "eHealth4Everyone",
    summary:
      "Led six engineers building health data systems for government clients. OpenHisa across twelve states; MSDAT (Gates Foundation) serving 10,000+ users.",
    stack: "Python · Django · React · MongoDB · PostgreSQL · Docker",
  },
  {
    period: "2016–18",
    role: "",
    company: "Swedish Nigerian Accelerator Program",
    summary: "",
    stack: "",
  },
];

export const cvFacts = [
  { term: "Focus", detail: "AI infrastructure, distributed systems, developer platforms" },
  { term: "Writing", detail: "Essays on engineering, notes on systems" },
];

export const social = [
  { label: "GitHub", href: "https://github.com/richardokonicha" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/richardokonicha" },
  { label: "X", href: "https://x.com/richardokonicha" },
  { label: "Medium", href: "https://medium.com/@richardokonicha" },
];

export interface Track {
  src: string;
  title: string;
  artist: string;
  artwork: string;
}

export const tracks: Track[] = [
  {
    src: "/audio/lofi-001.mp3",
    title: "Loop 001 — Paper",
    artist: "Original demo audio",
    artwork: "/img/player-art.svg",
  },
  {
    src: "/audio/lofi-002.mp3",
    title: "Loop 002 — Dust",
    artist: "Original demo audio",
    artwork: "/img/player-art.svg",
  },
];