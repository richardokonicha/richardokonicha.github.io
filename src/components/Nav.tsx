import { nav } from "@/lib/site";

/**
 * Static markup only — the scroll state, mobile toggle and section spy are
 * driven by src/scripts/behaviour.ts, which mutates the data attributes here.
 */
export default function Nav() {
  return (
    <header
      data-nav=""
      data-scrolled="false"
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-paper/86 backdrop-blur-[14px] transition-colors duration-300 data-[scrolled=true]:border-rule data-[scrolled=true]:bg-paper/95"
    >
      <div className="wrap flex h-16 items-center justify-between">
        <a
          href="#top"
          aria-label="Richard Okonicha, back to top"
          className="font-serif text-[1.55rem] leading-none tracking-[0.02em]"
        >
          RO
        </a>

        <button
          type="button"
          data-nav-toggle=""
          data-open="false"
          aria-expanded="false"
          aria-controls="nav-menu"
          className="group flex cursor-pointer items-center gap-[0.6rem] bg-transparent py-[0.4rem] font-mono text-[0.68rem] tracking-[0.12em] uppercase md:hidden"
        >
          <span>Menu</span>
          <span
            aria-hidden="true"
            className="relative block h-px w-[18px] bg-current transition-colors before:absolute before:-top-[5px] before:left-0 before:h-px before:w-[18px] before:bg-current before:transition-transform before:duration-[250ms] after:absolute after:top-[5px] after:left-0 after:h-px after:w-[18px] after:bg-current after:transition-transform after:duration-[250ms] group-data-[open=true]:bg-transparent group-data-[open=true]:before:translate-y-[5px] group-data-[open=true]:before:rotate-45 group-data-[open=true]:after:-translate-y-[5px] group-data-[open=true]:after:-rotate-45"
          />
        </button>

        <nav
          id="nav-menu"
          data-nav-menu=""
          data-open="false"
          aria-label="Primary"
          className="flex items-center gap-[2rem] font-mono text-[0.7rem] tracking-[0.12em] uppercase max-md:fixed max-md:inset-x-0 max-md:top-16 max-md:hidden max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:border-b max-md:border-rule max-md:bg-paper max-md:px-page-pad max-md:pt-[0.4rem] max-md:pb-[1rem] max-md:data-[open=true]:flex"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-nav-link=""
              className="text-muted transition-colors duration-200 hover:text-ink data-[active=true]:text-ink max-md:border-b max-md:border-rule max-md:py-[0.85rem] max-md:last:border-b-0"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}