"use client";

/**
 * The log. Newest first, with a year drum in the header.
 *
 * The drum only filters; every entry stays in the DOM (hidden, not unmounted),
 * so the scroll reveal keeps its state and a crawler still sees the whole log.
 */

import { DetentNumber } from "@hayderkg/detent/number";
import * as React from "react";

import Wheel from "@/components/Wheel";
import { cx, reveal, section } from "@/lib/classes";
import { entries, formatDate } from "@/lib/site";

const YEARS = Array.from(
  new Set(entries.map((entry) => entry.date.slice(0, 4))),
);
const FILTERS = ["All", ...YEARS];

const row =
  "group grid grid-cols-1 items-baseline gap-x-[clamp(1rem,3vw,2.5rem)] gap-y-[0.35rem] border-b border-rule py-[clamp(1.2rem,2.8vh,1.8rem)] transition-[padding-left] duration-[300ms] hover:pl-[0.7rem] xs:grid-cols-[92px_minmax(0,1fr)] tb:grid-cols-[110px_minmax(0,1fr)_auto]";

export default function Stream() {
  const [year, setYear] = React.useState("2026");

  const shown = React.useMemo(
    () =>
      year === "All"
        ? entries
        : entries.filter((entry) => entry.date.startsWith(year)),
    [year],
  );
  const visible = React.useMemo(
    () => new Set(shown.map((entry) => entry.title)),
    [shown],
  );

  return (
    <section id="log" className={cx(section, "scroll-mt-20 border-t border-rule")}>
      <div className="wrap">
        <header
          className={cx(
            "mb-[clamp(1.4rem,3vh,2rem)] flex flex-wrap items-baseline justify-between gap-x-[1.5rem] gap-y-[0.4rem] border-t border-ink pt-[1.1rem]",
            reveal,
          )}
        >
          <h2 className="font-mono text-[0.7rem] tracking-[0.16em] uppercase">
            Log
          </h2>
          <span className="font-mono text-[0.64rem] tracking-[0.1em] text-muted uppercase">
            <DetentNumber className="tabular-nums" locales="en-GB" value={shown.length} />{" "}
            {shown.length === 1 ? "entry" : "entries"}
          </span>
        </header>

        <div
          className={cx(
            "mb-[clamp(1.6rem,3.5vh,2.4rem)] flex flex-wrap items-center justify-between gap-x-[1.5rem] gap-y-[0.85rem]",
            reveal,
          )}
        >
          <Wheel
            className="h-11 font-mono text-[0.68rem] tracking-[0.06em]"
            itemSize={44}
            items={FILTERS}
            label="Filter the log by year"
            loop
            onChange={setYear}
            value={year}
            visibleCount={5}
          />

          {year === "All" ? (
            <span className="font-mono text-[0.64rem] tracking-[0.1em] text-muted uppercase">
              Newest first
            </span>
          ) : (
            <button
              className="cursor-pointer border-b border-rule pb-[0.1rem] font-mono text-[0.64rem] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:border-ink hover:text-ink"
              onClick={() => setYear("All")}
              type="button"
            >
              Show all
            </button>
          )}
        </div>

        <ol className="m-0 list-none border-t border-rule p-0">
          {entries.map((entry) => {
            const Tag = entry.href ? "a" : "div";
            return (
              <li
                className={reveal}
                hidden={!visible.has(entry.title)}
                key={entry.title}
              >
                <Tag
                  {...(entry.href ? { href: entry.href } : {})}
                  className={cx(row, entry.href ? "group" : "cursor-default")}
                >
                  <span className="font-mono text-[0.66rem] tracking-[0.05em] text-muted transition-colors duration-[250ms] group-hover:text-accent">
                    {formatDate(entry)}
                  </span>

                  <span className="min-w-0">
                    <span className="mb-[0.3rem] flex flex-wrap items-baseline gap-x-[0.9rem] gap-y-[0.2rem]">
                      <h3 className="font-serif text-[clamp(1.35rem,2.4vw,1.85rem)] leading-[1.1] tracking-[-0.01em]">
                        {entry.title}
                      </h3>
                      <span className="font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">
                        {entry.kind}
                      </span>
                    </span>
                    <span className="block max-w-[62ch] text-[0.92rem] leading-[1.6] text-muted">
                      {entry.summary}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={cx(
                      "hidden pt-[0.1rem] text-[1rem] transition-transform duration-[250ms] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] tb:block",
                      entry.href ? "text-ink" : "text-transparent",
                    )}
                  >
                    ↗
                  </span>
                </Tag>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}