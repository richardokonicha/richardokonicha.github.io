import { site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule py-[2rem]">
      <div className="wrap flex flex-wrap justify-between gap-x-[2rem] gap-y-[0.6rem] font-mono text-[0.62rem] tracking-[0.05em] text-muted uppercase max-md:flex-col">
        <p>
          {site.name} — <span data-year="">{site.year}</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-[1.25rem]">
          <a
            href="/cv/"
            className="transition-colors duration-200 hover:text-ink"
          >
            Résumé
          </a>
          <a
            href="#colophon"
            className="transition-colors duration-200 hover:text-ink"
          >
            Colophon
          </a>
        </nav>
      </div>
    </footer>
  );
}