import SectionHead from "@/components/SectionHead";
import { cx, reveal, section } from "@/lib/classes";
import { projects } from "@/lib/site";

export default function Work() {
  return (
    <section id="work" className={cx(section, "scroll-mt-20")}>
      <div className="wrap">
        <SectionHead no="01" title="Selected work" meta="2018 — 2026" />

        <ol className="m-0 list-none border-t border-rule p-0">
          {projects.map((project, index) => (
            <li
              key={project.name}
              className={cx(
                "group grid grid-cols-1 gap-[clamp(1rem,3vw,2.5rem)] border-b border-rule py-[clamp(1.5rem,4vh,2.5rem)] xs:grid-cols-[78px_minmax(0,1fr)] tb:grid-cols-[96px_minmax(0,1fr)_48px] max-xs:gap-y-[0.4rem]",
                reveal,
              )}
            >
              <span className="pt-[0.35rem] font-mono text-[0.72rem] tracking-[0.05em] text-muted transition-colors duration-[250ms] group-hover:text-accent max-xs:pt-0">
                {project.year}
              </span>

              <div>
                <div className="mb-[0.65rem] flex flex-wrap items-baseline gap-x-[1.25rem] gap-y-[0.5rem]">
                  <h3 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.05] tracking-[-0.01em]">
                    {project.name}
                  </h3>
                  <span className="font-mono text-[0.66rem] tracking-[0.08em] text-muted uppercase">
                    {project.role}
                  </span>
                </div>

                <p className="max-w-[62ch] text-[0.96rem] text-muted">
                  {project.summary}
                </p>
                <p className="mt-[0.7rem] font-mono text-[0.65rem] tracking-[0.04em] text-muted/80">
                  {project.stack}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="justify-self-end pt-[0.35rem] font-mono text-[0.64rem] text-rule max-tb:hidden"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}