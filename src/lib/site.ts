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
  { label: "Colophon", href: "#colophon" },
  { label: "Résumé", href: "/cv/" },
] as const;

/* ------------------------------------------------------------------ *
 * The log — newest first. Adding a thing you made is one object here.
 * ------------------------------------------------------------------ */

export type EntryKind = "work" | "note";

export interface Entry {
  /**
   * ISO `YYYY` or `YYYY-MM`. For a span, the end of it. Sorting is by this
   * field, so the stream is newest-first no matter how the list is typed.
   */
  date: string;
  /** Start of the span, when the entry covers more than one period. */
  since?: string;
  kind: EntryKind;
  title: string;
  summary: string;
  /** omit for entries that live only here */
  href?: string;
}

const log: Entry[] = [
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
    date: "2026",
    since: "2024",
    kind: "work",
    title: "InferenceCloud.ai",
    summary:
      "Multi-tenant AI writing platform for a Swiss team — queues, isolation, and a pipeline rebuilt for spikes.",
  },
  {
    date: "2024",
    since: "2022",
    kind: "work",
    title: "Swell",
    summary:
      "Storefront theme engine and origin theme for a high-scale enterprise SaaS platform.",
  },
  {
    date: "2022",
    since: "2020",
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
    date: "2020",
    since: "2018",
    kind: "work",
    title: "eHealth4Everyone",
    summary: "Health data systems for government clients — OpenHisa, MSDAT.",
  },
];

/** Newest first. ISO year strings sort lexicographically, which is chronological. */
export const entries: Entry[] = [...log].sort((a, b) =>
  a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
);

/** `2024–26` for a span, the bare year otherwise. */
export function formatDate(entry: Entry): string {
  if (!entry.since) return entry.date;
  const from = entry.since.slice(0, 4);
  const to = entry.date.slice(0, 4);
  return from === to ? entry.date : `${from}–${to.slice(2)}`;
}

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
  /** Length in seconds; the audio element corrects this once metadata loads. */
  duration: number;
}

export const tracks: Track[] = [
  {
    src: "/audio/lofi-001.mp3",
    title: "Loop 001 — Paper",
    artist: "Original demo audio",
    artwork: "/img/player-art.svg",
    duration: 48,
  },
  {
    src: "/audio/lofi-002.mp3",
    title: "Loop 002 — Dust",
    artist: "Original demo audio",
    artwork: "/img/player-art.svg",
    duration: 48,
  },
];