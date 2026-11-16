import { cx } from "@/lib/classes";
import { reveal } from "@/lib/classes";

interface SectionHeadProps {
  no: string;
  title: string;
  meta?: string;
  tone?: "light" | "dark";
  className?: string;
}

export default function SectionHead({
  no,
  title,
  meta,
  tone = "light",
  className,
}: SectionHeadProps) {
  const dark = tone === "dark";

  return (
    <header
      className={cx(
        "mb-[clamp(2.5rem,6vh,4.5rem)] grid grid-cols-[auto_1fr_auto] items-baseline gap-x-[1.25rem] border-t pt-[1.1rem] max-md:grid-cols-[auto_1fr]",
        reveal,
        dark ? "border-paper/28" : "border-ink",
        className,
      )}
    >
      <span
        className={cx(
          "font-mono text-[0.7rem] tracking-[0.1em]",
          dark ? "text-ember" : "text-accent",
        )}
      >
        {no}
      </span>

      <h2 className="font-serif text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.01em]">
        {title}
      </h2>

      {meta ? (
        <span
          className={cx(
            "justify-self-end font-mono text-[0.64rem] tracking-[0.1em] uppercase max-md:col-start-2 max-md:mt-[0.2rem] max-md:justify-self-start",
            dark ? "text-dark-muted" : "text-muted",
          )}
        >
          {meta}
        </span>
      ) : null}
    </header>
  );
}