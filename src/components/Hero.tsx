import { cx, reveal } from "@/lib/classes";

export default function Hero() {
  return (
    <section
      id="top"
      className="flex min-h-svh items-center pt-[calc(var(--spacing-nav)_+_clamp(3rem,8vh,6rem))] pb-[clamp(3rem,8vh,6rem)] max-tb:min-h-0 max-tb:pt-32"
    >
      <div className="wrap grid grid-cols-1 items-center">
        <div className="hero-copy">
          <p
            className={cx(
              "mb-[clamp(1.5rem,4vh,2.5rem)] font-mono text-[0.7rem] tracking-[0.18em] text-muted uppercase",
              reveal,
            )}
          >
            Independent builder
          </p>

          <h1
            data-pretext-lines=""
            className="-ml-[0.04em] font-serif text-[clamp(3.4rem,9.6vw,9rem)] leading-[0.9] tracking-[-0.03em]"
          >
            Richard Okonicha
          </h1>

          <p
            data-pretext-lines=""
            className="mt-[clamp(1.75rem,4vh,2.75rem)] max-w-[46ch] text-[clamp(1rem,1.35vw,1.12rem)] leading-[1.6] text-muted"
          >
            Software engineer, systems architect and independent builder. I work
            across software engineering, artificial intelligence, cloud
            infrastructure and distributed systems.
          </p>

          <p
            className={cx(
              "mt-[1.1rem] max-w-[42ch] font-serif text-[clamp(1.15rem,1.8vw,1.4rem)] leading-[1.35]",
              reveal,
            )}
          >
            I enjoy building things, exploring ideas and understanding how complex
            systems work.
          </p>

          <div
            className={cx(
              "mt-[clamp(2rem,5vh,3.5rem)] flex flex-wrap items-center gap-x-[2rem] gap-y-[1rem]",
              reveal,
            )}
          >
            <a
              href="#work"
              className="group inline-flex items-center gap-[0.7rem] font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-ink"
            >
              <span>Selected work</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-[250ms] group-hover:translate-y-[3px]"
              >
                ↓
              </span>
            </a>

            <span className="inline-flex items-center gap-[0.55rem] font-mono text-[0.66rem] tracking-[0.08em] text-muted">
              <span className="size-[6px] rounded-full bg-accent animate-dot" />
              Currently building Fugoku Cloud
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}