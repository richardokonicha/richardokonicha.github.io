import type { Metadata } from "next";

import { cx, reveal } from "@/lib/classes";
import { cvFacts, entries, roles, site, social } from "@/lib/site";

export const metadata: Metadata = {
  title: "Résumé — Richard Okonicha",
  description:
    "Experience, selected work and writing. Software engineer and systems architect.",
  alternates: { canonical: "/cv/" },
};

const label = "font-mono text-[0.62rem] tracking-[0.14em] text-muted uppercase";

export default function CvPage() {
  const writing = entries.filter((entry) => entry.kind === "note");

  return (
    <div className="wrap py-[clamp(4rem,10vh,7rem)]">
      <article className="mx-auto max-w-[720px]">
        <header className={cx("border-b border-ink pb-[1.5rem]", reveal)}>
          <h1 className="font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-[0.95] tracking-[-0.025em]">
            {site.name}
          </h1>
          <p className="mt-[0.9rem] max-w-[52ch] text-[0.98rem] text-muted">
            Software engineer and systems architect. AI infrastructure,
            distributed systems, developer platforms.
          </p>

          <ul className="mt-[1.4rem] flex list-none flex-wrap gap-x-[1.25rem] gap-y-[0.4rem] p-0 font-mono text-[0.66rem] tracking-[0.06em] uppercase">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="border-b border-rule pb-[0.1rem] transition-colors duration-200 hover:border-ink"
              >
                {site.email}
              </a>
            </li>
            {social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="border-b border-rule pb-[0.1rem] text-muted transition-colors duration-200 hover:border-ink hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <section className={cx("mt-[clamp(2.5rem,6vh,3.5rem)]", reveal)}>
          <h2 className={label}>Experience</h2>

          <ol className="mt-[1.2rem] m-0 list-none border-t border-rule p-0">
            {roles.map((role) => (
              <li
                key={`${role.period}-${role.company}`}
                className="grid grid-cols-1 gap-x-[1.5rem] gap-y-[0.3rem] border-b border-rule py-[1.1rem] xs:grid-cols-[86px_minmax(0,1fr)]"
              >
                <span className="pt-[0.2rem] font-mono text-[0.64rem] tracking-[0.04em] text-muted">
                  {role.period}
                </span>

                <div>
                  <h3 className="font-serif text-[clamp(1.2rem,2vw,1.5rem)] leading-[1.15]">
                    {role.company}
                  </h3>
                  {role.role ? (
                    <p className="mt-[0.15rem] font-mono text-[0.64rem] tracking-[0.08em] text-accent uppercase">
                      {role.role}
                    </p>
                  ) : null}
                  {role.summary ? (
                    <p className="mt-[0.55rem] max-w-[60ch] text-[0.92rem] leading-[1.6] text-muted">
                      {role.summary}
                    </p>
                  ) : null}
                  {role.stack ? (
                    <p className="mt-[0.5rem] font-mono text-[0.62rem] tracking-[0.03em] text-muted/85">
                      {role.stack}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={cx("mt-[clamp(2.5rem,6vh,3.5rem)]", reveal)}>
          <h2 className={label}>Writing</h2>

          <ul className="mt-[1.2rem] m-0 list-none border-t border-rule p-0">
            {writing.map((entry) => {
              const Tag = entry.href ? "a" : "div";
              return (
                <li key={entry.title} className="border-b border-rule">
                  <Tag
                    {...(entry.href ? { href: entry.href } : {})}
                    className="flex flex-wrap items-baseline justify-between gap-x-[1.5rem] gap-y-[0.2rem] py-[0.85rem]"
                  >
                    <span className="font-serif text-[1.15rem] leading-[1.2]">
                      {entry.title}
                    </span>
                    <span className="font-mono text-[0.62rem] tracking-[0.06em] text-muted uppercase">
                      {entry.date}
                    </span>
                  </Tag>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={cx("mt-[clamp(2.5rem,6vh,3.5rem)]", reveal)}>
          <h2 className={label}>Focus</h2>

          <dl className="mt-[1.2rem] grid grid-cols-1 gap-x-[2rem] gap-y-[0.9rem] border-t border-rule pt-[1.2rem] xs:grid-cols-2">
            {cvFacts.map((fact) => (
              <div key={fact.term}>
                <dt className={label}>{fact.term}</dt>
                <dd className="mt-[0.25rem] text-[0.92rem]">{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="mt-[clamp(3rem,8vh,5rem)] border-t border-rule pt-[1.2rem]">
          <a
            href="/"
            className="group inline-flex items-center gap-[0.6rem] font-mono text-[0.66rem] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:text-ink"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-[250ms] group-hover:-translate-x-[3px]"
            >
              ←
            </span>
            <span>Back to the log</span>
          </a>
        </footer>
      </article>
    </div>
  );
}