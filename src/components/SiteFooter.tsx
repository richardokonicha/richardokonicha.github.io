import { site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule py-[2rem]">
      <div className="wrap flex flex-wrap justify-between gap-x-[2rem] gap-y-[0.6rem] font-mono text-[0.62rem] tracking-[0.05em] text-muted uppercase max-md:flex-col">
        <p>Richard Okonicha</p>
        <p className="max-w-[46ch]">
          Set in Instrument Serif, Inter &amp; Fira Code. Pretext for line layout,
          CSS Bayer dithering, a little Web Audio.
        </p>
        <p>
          © <span data-year="">{site.year}</span>
        </p>
      </div>
    </footer>
  );
}