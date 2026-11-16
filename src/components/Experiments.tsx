import Dither from "@/components/Dither";
import SectionHead from "@/components/SectionHead";
import { cx, reveal, section } from "@/lib/classes";

const speeds = [
  { value: "0.5", label: "0.5×" },
  { value: "1", label: "1×" },
  { value: "5", label: "5×" },
  { value: "10", label: "10×" },
];

const speedButton =
  "cursor-pointer appearance-none border border-paper/22 px-[0.5rem] py-[0.28rem] font-mono text-[0.6rem] tracking-[0.04em] text-dark-muted transition-colors duration-200 hover:border-paper/55 hover:text-paper data-[active=true]:border-paper data-[active=true]:bg-paper data-[active=true]:text-ink";

const plateHead =
  "mb-[1.25rem] flex items-baseline gap-[0.75rem] border-t border-dark-rule pt-[0.9rem]";
const plateNo =
  "font-mono text-[0.64rem] tracking-[0.08em] text-ember";
const plateTitle =
  "font-serif text-[clamp(1.45rem,2.4vw,1.9rem)] leading-none";

export default function Experiments() {
  return (
    <section
      id="experiments"
      className={cx(section, "scroll-mt-20 bg-dark text-paper")}
    >
      <div className="wrap">
        <SectionHead
          no="02"
          title="Experiments"
          meta="Type, noise, order"
          tone="dark"
        />

        <div className="grid grid-cols-1 gap-[clamp(1.5rem,3vw,2.75rem)] max-md:gap-[2.5rem] md:grid-cols-2 tb:grid-cols-3">
          <article className={cx("flex min-w-0 flex-col", reveal)}>
            <div className={plateHead}>
              <span className={plateNo}>E01</span>
              <h3 className={plateTitle}>Unreproducible</h3>
            </div>

            <div className="border border-dark-rule bg-paper p-[0.6rem]">
              <canvas
                id="field"
                width={400}
                height={400}
                aria-label="A random-walk particle field drawing itself"
                className="block aspect-square h-auto w-full cursor-crosshair bg-paper [image-rendering:pixelated]"
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
                <button type="button" data-action="restart" className={speedButton}>
                  Restart
                </button>
              </div>
            </div>

            <p className="mt-[1.1rem] text-[0.92rem] leading-[1.6] text-dark-muted">
              A particle that never repeats itself. Each frame, a random walk; the
              path accumulates into a cloud that cannot be reproduced.
            </p>
            <p className="mt-[0.9rem] font-mono text-[0.68rem] leading-[1.8] text-dark-muted/85">
              x = x + (random() − 0.5) × 8
              <br />
              y = y + (random() − 0.5) × 8
            </p>
          </article>

          <article className={cx("flex min-w-0 flex-col", reveal)}>
            <div className={plateHead}>
              <span className={plateNo}>E02</span>
              <h3 className={plateTitle}>Ordered</h3>
            </div>

            <div
              tabIndex={0}
              className="group relative w-full overflow-hidden outline-none focus-visible:outline focus-visible:outline-offset-[3px] focus-visible:outline-accent"
            >
              <Dither
                src="/img/study-01.svg"
                alt="Generative field study reduced to ordered dots"
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
                src="/img/study-01.svg"
                alt=""
                width={800}
                height={800}
                loading="lazy"
              />
            </div>

            <p className="mt-[1.1rem] text-[0.92rem] leading-[1.6] text-dark-muted">
              A continuous image reduced to a grid of dots. Ordered Bayer dithering
              — no blur, no gradient, just threshold and repetition.
            </p>
          </article>

          <article
            className={cx(
              "flex min-w-0 flex-col md:col-span-2 md:max-w-[560px] tb:col-span-1 tb:max-w-none",
              reveal,
            )}
          >
            <div className={plateHead}>
              <span className={plateNo}>E03</span>
              <h3 className={plateTitle}>Set</h3>
            </div>

            <blockquote
              data-pretext-lines=""
              className="border-l border-paper/28 py-[0.25rem] pr-0 pl-[1.25rem] font-serif text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.015em] text-paper"
            >
              Typography is not the art of seeing the words. It is the art of making
              the space between them visible.
            </blockquote>

            <p className="mt-[1.1rem] text-[0.92rem] leading-[1.6] text-dark-muted">
              Line-by-line composition measured with Pretext — the browser&apos;s own
              font engine, used without a single DOM read.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}