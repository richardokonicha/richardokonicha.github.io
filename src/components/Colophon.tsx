import { cx, reveal, section } from "@/lib/classes";
import { site, social } from "@/lib/site";

export default function Colophon() {
  return (
    <section id="colophon" className={cx(section, "scroll-mt-20")}>
      <div className="wrap grid grid-cols-1 gap-[clamp(2rem,5vw,4rem)] tb:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={reveal}>
          <h2 className="mb-[1.5rem] border-t border-ink pt-[1.1rem] font-mono text-[0.7rem] tracking-[0.16em] uppercase">
            Colophon
          </h2>

          <p className="mb-[1.2rem] max-w-[46ch] font-serif text-[clamp(1.35rem,2.4vw,1.85rem)] leading-[1.25] tracking-[-0.01em] text-muted">
            I build infrastructure that other people build on, and I keep this site
            for the things that don&apos;t fit in a job title.
          </p>

          <p className="mb-[1rem] max-w-[54ch] text-[0.95rem] text-muted">
            Notes, studies, generative sketches, and the occasional essay. Some of it
            is finished. Most of it is in progress, which is the point of keeping a
            log rather than a portfolio.
          </p>

          <p className="max-w-[54ch] text-[0.95rem] text-muted">
            Set in Instrument Serif, Inter &amp; Fira Code. Pretext does the line
            breaking, CSS does the dithering, and a little Web Audio does the rest.
          </p>
        </div>

        <div className={cx("tb:pt-[3.6rem]", reveal)}>
          <h2 className="mb-[1.5rem] border-t border-rule pt-[1.1rem] font-mono text-[0.7rem] tracking-[0.16em] text-muted uppercase">
            Elsewhere
          </h2>

          <ul className="m-0 flex list-none flex-col gap-[0.7rem] p-0">
            {social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="group inline-flex items-baseline gap-[0.6rem] text-[0.95rem]"
                >
                  <span className="border-b border-transparent pb-[0.1rem] transition-colors duration-200 group-hover:border-ink">
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-[0.8rem] text-muted transition-transform duration-[250ms] group-hover:translate-x-[2px] group-hover:-translate-y-[2px] group-hover:text-accent"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-[2rem] font-mono text-[0.68rem] tracking-[0.06em] text-muted">
            <a
              href={`mailto:${site.email}`}
              className="border-b border-ink pb-[0.15rem] transition-colors duration-200 hover:border-ember hover:text-ember"
            >
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}