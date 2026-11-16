import SectionHead from "@/components/SectionHead";
import { cx, reveal, section } from "@/lib/classes";
import { notes } from "@/lib/site";

const noteRow =
  "grid grid-cols-1 items-start gap-[clamp(1rem,3vw,2.5rem)] border-b border-rule py-[clamp(1.3rem,3.2vh,2rem)] transition-[padding-left] duration-[250ms] hover:pl-[0.8rem] xs:grid-cols-[1fr_auto] md:grid-cols-[110px_minmax(0,1fr)_auto]";

export default function Notes() {
  return (
    <section id="notes" className={cx(section, "scroll-mt-20")}>
      <div className="wrap">
        <SectionHead
          no="03"
          title="Notes"
          meta={"Writing & field guides"}
        />

        <ul className="m-0 list-none border-t border-rule p-0">
          {notes.map((note) => {
            const Tag = note.href ? "a" : "div";
            return (
              <li key={note.title} className={reveal}>
                <Tag
                  {...(note.href ? { href: note.href } : {})}
                  className={cx(
                    noteRow,
                    note.href ? "group" : "cursor-default",
                  )}
                >
                  <span className="flex flex-row flex-wrap gap-x-[0.75rem] gap-y-[0.2rem] pt-0 font-mono text-[0.66rem] tracking-[0.08em] text-muted uppercase xs:col-span-2 md:col-span-1 md:flex-col md:gap-[0.2rem] md:pt-[0.4rem]">
                    <span>{note.date}</span>
                    <span>{note.kind}</span>
                  </span>

                  <span className="block">
                    <h3 className="mb-[0.45rem] font-serif text-[clamp(1.45rem,2.8vw,2.2rem)] leading-[1.08] tracking-[-0.01em]">
                      {note.title}
                    </h3>
                    <span className="block max-w-[54ch] text-[0.92rem] text-muted">
                      {note.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={cx(
                      "hidden pt-[0.2rem] text-[1.1rem] transition-transform duration-[250ms] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] xs:block",
                      note.href ? "text-ink" : "text-rule",
                    )}
                  >
                    {note.href ? "↗" : "·"}
                  </span>
                </Tag>
              </li>
            );
          })}
        </ul>

        <figure
          className={cx(
            "mt-[clamp(2.5rem,6vh,4rem)] border-l-2 border-accent bg-paper-2 p-[clamp(1.4rem,3.5vw,2.2rem)]",
            reveal,
          )}
        >
          <blockquote className="max-w-[34ch]">
            <p className="font-serif text-[clamp(1.3rem,2.6vw,1.9rem)] leading-[1.2] tracking-[-0.01em]">
              “Running Kubernetes on AMD GPU hardware is possible, but the path is
              not as well documented as the NVIDIA equivalent.”
            </p>
          </blockquote>
          <figcaption className="flex flex-wrap justify-between gap-x-[1.25rem] gap-y-[0.4rem] font-mono text-[0.64rem] tracking-[0.08em] text-muted uppercase">
            <span>Kubernetes on AMD GPUs with ROCm</span>
            <span>Notebook, 2026</span>
          </figcaption>
        </figure>

        <p
          className={cx(
            "mt-[2.25rem] font-mono text-[0.68rem] tracking-[0.12em] uppercase",
            reveal,
          )}
        >
          <a
            href="https://medium.com/@richardokonicha"
            className="border-b border-ink pb-[0.15rem]"
          >
            More on Medium
          </a>
        </p>
      </div>
    </section>
  );
}