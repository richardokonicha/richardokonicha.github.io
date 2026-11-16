import { tracks } from "@/lib/site";

const first = tracks[0]!;

const button =
  "h-[28px] min-w-[28px] cursor-pointer appearance-none border border-rule bg-transparent px-[0.4rem] font-mono text-[0.62rem] text-ink transition-colors duration-200 hover:border-ink hover:bg-paper-2";

/**
 * Presentational only. Playback, seeking, volume persistence and the expand
 * state live in src/scripts/player.ts, driven through data attributes.
 */
export default function Player() {
  return (
    <div
      id="player"
      data-player=""
      data-collapsed="true"
      data-playing="false"
      className="group fixed right-[clamp(1rem,2.5vw,2rem)] bottom-[clamp(1rem,2.5vw,2rem)] z-[60] flex flex-col items-end gap-[0.6rem] max-md:right-[1rem] max-md:bottom-[1rem] max-md:left-[1rem] max-md:items-stretch"
    >
      <div className="flex items-center gap-[0.7rem] rounded-full border border-paper/14 bg-ink py-[0.45rem] pr-[0.6rem] pl-[0.45rem] text-paper shadow-[0_10px_30px_rgba(20,17,14,0.22)] max-md:w-full">
        <button
          className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full border border-paper/30 bg-transparent text-paper transition-colors duration-200 hover:border-paper/60 hover:bg-paper/12"
          type="button"
          data-player-toggle=""
          aria-label="Play lo-fi music"
          aria-pressed="false"
        >
          <span
            aria-hidden="true"
            className="ml-[2px] size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current group-data-[playing=true]:hidden"
          />
          <span
            aria-hidden="true"
            className="hidden h-[10px] w-[8px] border-r-[3px] border-l-[3px] border-current group-data-[playing=true]:block"
          />
        </button>

        <div className="flex min-w-0 flex-col leading-[1.15] max-md:flex-1">
          <span
            className="truncate text-[0.74rem] font-medium"
            data-player-title=""
          >
            {first.title}
          </span>
          <span
            className="truncate font-mono text-[0.56rem] tracking-[0.04em] text-paper/55"
            data-player-artist=""
          >
            {first.artist}
          </span>
        </div>

        <button
          className="grid size-[28px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-paper/60 transition-[color,transform] duration-300 hover:text-paper"
          type="button"
          data-player-expand=""
          aria-label="Expand player"
          aria-expanded="false"
          aria-controls="player-panel"
        >
          <span
            aria-hidden="true"
            className="h-[7px] w-[7px] -translate-x-[2px] -translate-y-[2px] rotate-45 border-r border-b border-current transition-transform duration-300 group-data-[collapsed=false]:rotate-[225deg]"
          />
        </button>
      </div>

      <div
        id="player-panel"
        data-player-panel=""
        hidden
        className="grid w-[min(340px,calc(100vw-2rem))] grid-cols-[64px_1fr] gap-[0.9rem] border border-ink bg-paper p-[1rem] text-ink shadow-[0_18px_50px_rgba(20,17,14,0.28)] max-md:w-full max-xs:grid-cols-[48px_1fr]"
      >
        <div className="size-[64px] overflow-hidden bg-ink max-xs:size-[48px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="size-full object-cover"
            src={first.artwork}
            alt=""
            width={320}
            height={320}
            data-player-art=""
          />
        </div>

        <div className="flex min-w-0 flex-col gap-[0.6rem]">
          <div className="flex flex-col leading-[1.2]">
            <span
              className="truncate text-[0.8rem] font-medium"
              data-player-title=""
            >
              {first.title}
            </span>
            <span
              className="truncate font-mono text-[0.56rem] tracking-[0.04em] text-muted"
              data-player-artist=""
            >
              {first.artist}
            </span>
          </div>

          <div className="flex flex-col gap-[0.2rem]">
            <input
              className="player__seek"
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              step="0.1"
              aria-label="Seek"
              data-player-seek=""
            />
            <div
              className="flex justify-between font-mono text-[0.58rem] text-muted"
              aria-hidden="true"
            >
              <span data-player-current="">0:00</span>
              <span data-player-duration="">0:00</span>
            </div>
          </div>

          <div className="flex items-center gap-[0.35rem]">
            <button
              type="button"
              className={button}
              data-player-prev=""
              aria-label="Previous track"
            >
              ←
            </button>
            <button
              type="button"
              className="h-[28px] min-w-[28px] cursor-pointer appearance-none border border-ink bg-ink px-[0.4rem] font-mono text-[0.62rem] text-paper transition-colors duration-200 hover:bg-ink"
              data-player-play=""
              aria-label="Play"
            >
              <span
                aria-hidden="true"
                className="ml-[2px] block size-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-current group-data-[playing=true]:hidden"
              />
              <span
                aria-hidden="true"
                className="hidden h-[9px] w-[7px] border-r-[3px] border-l-[3px] border-current group-data-[playing=true]:block"
              />
            </button>
            <button
              type="button"
              className={button}
              data-player-next=""
              aria-label="Next track"
            >
              →
            </button>
            <button
              type="button"
              className={button}
              data-player-mute=""
              aria-label="Mute"
            >
              Mute
            </button>
          </div>

          <div className="flex items-center gap-[0.5rem] font-mono text-[0.58rem] text-muted">
            <span aria-hidden="true">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.6"
              aria-label="Volume"
              data-player-volume=""
            />
          </div>

          <p className="border-t border-rule pt-[0.5rem] font-mono text-[0.56rem] leading-[1.5] text-muted">
            Placeholder audio — swap in a licensed track in{" "}
            <code className="text-[0.56rem]">src/lib/site.ts</code>.
          </p>
        </div>
      </div>
    </div>
  );
}