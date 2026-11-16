import { cx, reveal } from "@/lib/classes";
import { site } from "@/lib/site";

export default function Cover() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh items-center overflow-hidden pt-[calc(var(--spacing-nav)_+_clamp(3rem,8vh,6rem))] pb-[clamp(3rem,8vh,6rem)] max-tb:min-h-0 max-tb:pt-32"
    >
      {/* The field is a background, so it cannot take the pointer: the copy
          above it has to stay selectable and clickable. */}
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 size-full"
        id="field"
      />

      <div className="wrap relative z-10 grid grid-cols-1 items-center">
        <div className="hero-copy">
          <h1
            data-pretext-lines=""
            className="-ml-[0.04em] font-serif text-[clamp(3.4rem,9.6vw,9rem)] leading-[0.9] tracking-[-0.03em]"
          >
            {site.name}
          </h1>

          <p
            data-pretext-lines=""
            className="mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[34ch] font-serif text-[clamp(1.3rem,2.6vw,2rem)] leading-[1.25] tracking-[-0.01em] text-muted"
          >
            {site.tagline}
          </p>

          <div
            className={cx(
              "mt-[clamp(2.5rem,6vh,4rem)] flex flex-wrap items-center gap-x-[2rem] gap-y-[1rem]",
              reveal,
            )}
          >
            <a
              href="#log"
              className="group inline-flex items-center gap-[0.7rem] font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-ink"
            >
              <span>Start reading</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-[250ms] group-hover:translate-y-[3px]"
              >
                ↓
              </span>
            </a>

            <span className="inline-flex items-center gap-[0.55rem] font-mono text-[0.66rem] tracking-[0.08em] text-muted">
              <span className="size-[6px] rounded-full bg-accent animate-dot" />
              Updated {site.year}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}