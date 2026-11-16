import { cx, reveal, section } from "@/lib/classes";
import { site, social } from "@/lib/site";

export default function Contact() {
  return (
    <section
      id="contact"
      className={cx(section, "scroll-mt-20 border-t border-dark bg-dark text-paper")}
    >
      <div className={cx("wrap", reveal)}>
        <p className="mb-[clamp(1.5rem,4vh,2.5rem)] font-mono text-[0.7rem] tracking-[0.18em] text-dark-muted uppercase">
          Contact
        </p>

        <h2 className="mb-[1.75rem] font-serif text-[clamp(2.8rem,9vw,7rem)] leading-[0.92] tracking-[-0.025em]">
          Let’s talk.
        </h2>

        <a
          className="inline-block border-b border-paper/60 pb-[0.15rem] font-serif text-[clamp(1.25rem,3.2vw,2.2rem)] transition-colors duration-200 hover:border-ember hover:text-ember"
          href={`mailto:${site.email}`}
        >
          {site.email}
        </a>

        <ul className="mt-[clamp(2rem,6vh,3.5rem)] flex list-none flex-wrap gap-x-[1.75rem] gap-y-[1rem] p-0 font-mono text-[0.7rem] tracking-[0.1em] uppercase">
          {social.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-dark-muted transition-colors duration-200 hover:text-paper"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}