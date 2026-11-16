import Dither from "@/components/Dither";
import { cx, reveal, section } from "@/lib/classes";
import { plates } from "@/lib/site";

const speeds = [
  { value: "0.5", label: "0.5×" },
  { value: "1", label: "1×" },
  { value: "5", label: "5×" },
  { value: "10", label: "10×" },
];

const speedButton =
  "cursor-pointer appearance-none border border-print-ink/22 px-[0.5rem] py-[0.28rem] font-mono text-[0.6rem] tracking-[0.04em] text-print-muted transition-colors duration-200 hover:border-print-ink/55 hover:text-print-ink data-[active=true]:border-print-ink data-[active=true]:bg-print-ink data-[active=true]:text-print";

const head =
  "mb-[1.25rem] flex items-baseline gap-[0.75rem] border-t border-dark-rule pt-[0.9rem]";
const no = "font-mono text-[0.64rem] tracking-[0.08em] text-ember";
const title = "font-serif text-[clamp(1.45rem,2.4vw,1.9rem)] leading-none";
const caption = "mt-[1.1rem] text-[0.92rem] leading-[1.6] text-dark-muted";

export default function Plates() {
  return (
    <section
      id="plates"
      className={cx(section, "scroll-mt-20 border-t border-dark bg-dark text-dark-ink")}
    >
      <div className="wrap">
        <header
          className={cx(
            "mb-[clamp(2rem,5vh,3.5rem)] flex flex-wrap items-baseline justify-between gap-x-[1.5rem] gap-y-[0.4rem] border-t border-dark-ink/28 pt-[1.1rem]",
            reveal,
          )}
        >
          <h2 className="font-mono text-[0.7rem] tracking-[0.16em] uppercase">
            Plates
          </h2>
          <span className="font-mono text-[0.64rem] tracking-[0.1em] text-dark-muted uppercase">
            Type, noise, order
          </span>
        </header>

        <div className="grid grid-cols-1 gap-[clamp(1.5rem,3vw,2.75rem)] max-md:gap-[2.5rem] md:grid-cols-2 tb:grid-cols-3">
          {plates.map((plate) => (
            <article
              key={plate.no}
              className={cx(
                "flex min-w-0 flex-col",
                plate.kind === "type" &&
                  "md:col-span-2 md:max-w-[560px] tb:col-span-1 tb:max-w-none",
                reveal,
              )}
            >
              <div className={head}>
                <span className={no}>{plate.no}</span>
                <h3 className={title}>{plate.title}</h3>
              </div>

              {plate.kind === "field" ? (
                <>
                  <div className="border border-dark-rule bg-print p-[0.6rem]">
                    <canvas
                      id="field"
                      width={400}
                      height={400}
                      aria-label="A random-walk particle field drawing itself"
                      className="block aspect-square h-auto w-full cursor-crosshair bg-print [image-rendering:pixelated]"
                    />
                    <div className="mt-[0.6rem] flex flex-wrap items-center justify-between gap-[0.5rem]">
                      <div
                        className="flex flex-wrap gap-[0.25rem]"
                        role="group"
                        aria-label="Simulation speed"
                        data-speed-group=""
                      >
                        {speeds.map((speed, index) => (
                          <button
                            key={speed.value}
                            type="button"
                            data-speed={speed.value}
                            data-active={index === 1 ? "true" : "false"}
                            aria-pressed={index === 1}
                            className={speedButton}
                          >
                            {speed.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        data-action="restart"
                        className={speedButton}
                      >
                        Restart
                      </button>
                    </div>
                  </div>

                  <p className={caption}>{plate.caption}</p>
                  <p className="mt-[0.9rem] font-mono text-[0.68rem] leading-[1.8] text-dark-muted/85">
                    {plate.formula.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </>
              ) : null}

              {plate.kind === "image" ? (
                <>
                  <div
                    tabIndex={0}
                    className="group relative w-full overflow-hidden outline-none focus-visible:outline focus-visible:outline-offset-[3px] focus-visible:outline-accent"
                  >
                    <Dither
                      src={plate.src}
                      alt={plate.alt}
                      width={800}
                      height={800}
                      size="lg"
                      contrast={118}
                      hover={0.28}
                      className="w-full"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="pointer-events-none absolute inset-0 z-[2] size-full object-cover [mask-image:linear-gradient(100deg,#000_0%,#000_40%,transparent_60%,transparent_100%)] [mask-repeat:no-repeat] [mask-position:100%_0] [mask-size:200%_100%] [-webkit-mask-position:100%_0] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:200%_100%] transition-[mask-position] duration-[800ms] ease-silk group-hover:[mask-position:0%_0] group-hover:[-webkit-mask-position:0%_0] group-focus-visible:[mask-position:0%_0] group-focus-visible:[-webkit-mask-position:0%_0]"
                      src={plate.src}
                      alt=""
                      width={800}
                      height={800}
                      loading="lazy"
                    />
                  </div>

                  <p className={caption}>{plate.caption}</p>
                </>
              ) : null}

              {plate.kind === "type" ? (
                <>
                  <blockquote
                    data-pretext-lines=""
                    className="border-l border-dark-ink/28 py-[0.25rem] pr-0 pl-[1.25rem] font-serif text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.015em] text-dark-ink"
                  >
                    {plate.quote}
                  </blockquote>

                  <p className={caption}>{plate.caption}</p>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}