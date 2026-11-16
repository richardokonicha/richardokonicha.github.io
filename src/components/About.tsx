import Dither from "@/components/Dither";
import SectionHead from "@/components/SectionHead";
import { cx, reveal, section } from "@/lib/classes";
import { facts, timeline } from "@/lib/site";

export default function About() {
  return (
    <section id="about" className={cx(section, "scroll-mt-20")}>
      <div className="wrap grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-[clamp(2rem,6vw,6rem)] max-tb:grid-cols-1 max-tb:gap-[3rem]">
        <div className="sticky top-[calc(var(--spacing-nav)_+_2rem)] max-tb:static max-tb:max-w-[320px]">
          <div className={reveal}>
            <Dither
              src="/img/portrait.jpg"
              alt="Portrait of Richard Okonicha"
              width={760}
              height={760}
              size="md"
              contrast={140}
              opacity={0.5}
              hover={0.28}
              className="w-full max-w-[360px]"
            />
            <p className="mt-[0.7rem] font-mono text-[0.62rem] tracking-[0.08em] text-muted uppercase">
              Lagos, Nigeria · 6°27′N 3°23′E
            </p>
          </div>
        </div>

        <div className="max-tb:max-w-[640px]">
          <SectionHead no="04" title="About" className="mb-[2rem]" />

          <p
            className={cx(
              "mb-[1.5rem] max-w-[58ch] font-serif text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.18] tracking-[-0.015em] text-muted",
              reveal,
            )}
          >
            I build infrastructure that other people build on — health data systems,
            developer platforms, AI clouds.
          </p>

          <p className={cx("mb-[1rem] max-w-[58ch] text-muted", reveal)}>
            My work sits between distributed systems and the people who use them.
            I&apos;ve led teams, designed APIs, chased race conditions, and spent a
            lot of time making complex things feel simple.
          </p>

          <p className={cx("mb-[1rem] max-w-[58ch] text-muted", reveal)}>
            Outside of work: photography, typography, long walks, and the occasional
            generative sketch.
          </p>

          <ol
            className={cx(
              "mt-[2.5rem] m-0 list-none border-t border-rule p-0",
              reveal,
            )}
          >
            {timeline.map((entry) => (
              <li
                key={entry.period}
                className="grid grid-cols-[90px_1fr] gap-[1.25rem] border-b border-rule py-[0.7rem] text-[0.9rem]"
              >
                <span className="pt-[0.15rem] font-mono text-[0.66rem] tracking-[0.04em] text-muted">
                  {entry.period}
                </span>
                {entry.role}
              </li>
            ))}
          </ol>

          <dl
            className={cx(
              "mt-[2.25rem] grid grid-cols-2 gap-x-[2rem] gap-y-[1rem] max-tb:grid-cols-1",
              reveal,
            )}
          >
            {facts.map((fact) => (
              <div key={fact.term} className="border-t border-rule pt-[0.6rem]">
                <dt className="font-mono text-[0.62rem] tracking-[0.08em] text-muted uppercase">
                  {fact.term}
                </dt>
                <dd className="mt-[0.2rem] text-[0.88rem]">{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}