export const site = {
  name: "Richard Okonicha",
  title: "Richard Okonicha — Engineer & Writer",
  description:
    "Richard Okonicha is a software engineer and systems architect. AI infrastructure, distributed systems, photography, typography, and the occasional generative sketch.",
  email: "richardokonicha@gmail.com",
  year: 2026,
};

export const nav = [
  { label: "Work", href: "#work" },
  { label: "Experiments", href: "#experiments" },
  { label: "Notes", href: "#notes" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export interface Project {
  year: string;
  name: string;
  role: string;
  summary: string;
  stack: string;
}

export const projects: Project[] = [
  {
    year: "2026",
    name: "Fugoku Cloud",
    role: "Founder & Architect",
    summary:
      "Sovereign AI cloud on bare-metal OpenStack: GPU/TPU compute fabric, tenant isolation, and an LLM gateway that cut inference latency from 300ms+ in Europe to under 50ms in-region.",
    stack: "OpenStack · K3s · Python · Go · Terraform",
  },
  {
    year: "2024–26",
    name: "InferenceCloud.ai",
    role: "Senior Infrastructure Engineer",
    summary:
      "Multi-tenant AI writing platform for a Swiss team. High-concurrency queues, tenant isolation, and a request pipeline rebuilt for enterprise traffic spikes.",
    stack: "Python · Docker · Cloud infrastructure",
  },
  {
    year: "2022–24",
    name: "Swell",
    role: "Senior Engineer, Storefront",
    summary:
      "Owned the storefront theme engine and origin theme for a high-scale enterprise SaaS platform. Stripe payments, checkout race conditions, and onboarding that went from days to under two hours.",
    stack: "Kubernetes · PostgreSQL · Redis · Vue · TypeScript · Node",
  },
  {
    year: "2020–22",
    name: "Cardagraph",
    role: "Senior Engineer & Architect",
    summary:
      "Built machine-learning pipelines forecasting software delivery timelines, and the APIs that put those forecasts in front of clients.",
    stack: "Python · React · Docker · PostgreSQL",
  },
  {
    year: "2018–20",
    name: "eHealth4Everyone",
    role: "Technical Lead",
    summary:
      "Led six engineers building health data systems for government clients. OpenHisa across twelve Nigerian states; MSDAT (Gates Foundation) serving 10,000+ users.",
    stack: "Python · Django · React · MongoDB · PostgreSQL · Docker",
  },
];

export interface Note {
  date: string;
  kind: string;
  title: string;
  description: string;
  href?: string;
}

export const notes: Note[] = [
  {
    date: "2020",
    kind: "Essay",
    title: "Understanding Python: Your Baby Steps",
    description:
      "What a programming language actually is, and why a computer is a very literal child.",
    href: "https://medium.com/@richardokonicha/understanding-python-your-baby-steps-a2949c17670e",
  },
  {
    date: "2026",
    kind: "Notebook",
    title: "Kubernetes on AMD GPUs with ROCm",
    description:
      "ROCm, k3s, device plugins, and the failure modes nobody documents.",
  },
];

export interface TimelineEntry {
  period: string;
  role: string;
}

export const timeline: TimelineEntry[] = [
  { period: "2026", role: "Fugoku Cloud — Founder & Architect" },
  { period: "2024–26", role: "InferenceCloud.ai — Senior Infrastructure Engineer" },
  { period: "2022–24", role: "Swell — Senior Engineer, Storefront" },
  { period: "2020–22", role: "Cardagraph — Senior Engineer & Architect" },
  { period: "2018–20", role: "eHealth4Everyone — Technical Lead" },
  { period: "2016–18", role: "Swedish Nigerian Accelerator Program" },
];

export const facts = [
  {
    term: "Focus",
    detail: "AI infrastructure, distributed systems, developer platforms",
  },
  { term: "Availability", detail: "Select consulting & advisory" },
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