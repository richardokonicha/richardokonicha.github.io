import { tracks } from "@/lib/site";

const VOLUME_KEY = "ro-volume";
const DEFAULT_VOLUME = 0.6;

function readStore(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function initPlayer() {
  const rootEl = document.querySelector<HTMLElement>("[data-player]");
  const audioEl = document.getElementById("audio");
  const expandEl = document.querySelector<HTMLButtonElement>("[data-player-expand]");
  const panelEl = document.querySelector<HTMLElement>("[data-player-panel]");
  const seekEl = document.querySelector<HTMLInputElement>("[data-player-seek]");
  const volumeEl = document.querySelector<HTMLInputElement>("[data-player-volume]");
  const muteEl = document.querySelector<HTMLButtonElement>("[data-player-mute]");
  const prevEl = document.querySelector<HTMLButtonElement>("[data-player-prev]");
  const nextEl = document.querySelector<HTMLButtonElement>("[data-player-next]");

  if (
    !rootEl ||
    !(audioEl instanceof HTMLAudioElement) ||
    !expandEl ||
    !panelEl ||
    !seekEl ||
    !volumeEl ||
    !muteEl ||
    !prevEl ||
    !nextEl
  ) {
    return;
  }

  /* explicit aliases: function declarations are hoisted, so TypeScript will
     not carry the narrowing above into their bodies */
  const root: HTMLElement = rootEl;
  const audio: HTMLAudioElement = audioEl;
  const expand: HTMLButtonElement = expandEl;
  const panel: HTMLElement = panelEl;
  const seek: HTMLInputElement = seekEl;
  const volume: HTMLInputElement = volumeEl;
  const muteButton: HTMLButtonElement = muteEl;
  const prevButton: HTMLButtonElement = prevEl;
  const nextButton: HTMLButtonElement = nextEl;

  const playButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      "[data-player-toggle], [data-player-play]",
    ),
  );
  const currentLabel = root.querySelector<HTMLElement>("[data-player-current]");
  const durationLabel = root.querySelector<HTMLElement>("[data-player-duration]");
  const titleNodes = Array.from(
    root.querySelectorAll<HTMLElement>("[data-player-title]"),
  );
  const artistNodes = Array.from(
    root.querySelectorAll<HTMLElement>("[data-player-artist]"),
  );
  const artworkNodes = Array.from(
    root.querySelectorAll<HTMLImageElement>("[data-player-art]"),
  );

  let index = 0;

  function syncPlayState() {
    const playing = !audio.paused && !audio.ended;
    root.dataset.playing = String(playing);
    playButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Pause" : "Play");
    });
  }

  function loadTrack() {
    const track = tracks[index] ?? tracks[0]!;
    audio.src = track.src;
    audio.load();
    titleNodes.forEach((node) => {
      node.textContent = track.title;
    });
    artistNodes.forEach((node) => {
      node.textContent = track.artist;
    });
    artworkNodes.forEach((node) => {
      node.src = track.artwork;
    });
    if (currentLabel) currentLabel.textContent = "0:00";
    if (durationLabel) durationLabel.textContent = "0:00";
    syncPlayState();
  }

  function play() {
    if (!audio.getAttribute("src")) loadTrack();
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch((error: unknown) =>
        console.warn("Playback blocked", error),
      );
    }
  }

  function toggle() {
    if (audio.paused) play();
    else audio.pause();
  }

  playButtons.forEach((button) => {
    button.addEventListener("click", toggle);
  });

  audio.addEventListener("play", syncPlayState);
  audio.addEventListener("pause", syncPlayState);
  audio.addEventListener("ended", () => {
    syncPlayState();
    if (tracks.length > 1) {
      index = (index + 1) % tracks.length;
      loadTrack();
      play();
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationLabel) durationLabel.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (currentLabel) currentLabel.textContent = formatTime(audio.currentTime);
    if (audio.duration) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
    }
  });

  seek.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    if (currentLabel) currentLabel.textContent = formatTime(audio.currentTime);
  });

  function setVolume(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    audio.volume = clamped;
    volume.value = String(clamped);
    writeStore(VOLUME_KEY, String(clamped));
  }

  function setMuted(muted: boolean) {
    audio.muted = muted;
    muteButton.textContent = muted ? "Unmute" : "Mute";
    muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  volume.addEventListener("input", () => {
    setVolume(Number(volume.value));
    if (audio.volume > 0 && audio.muted) setMuted(false);
  });

  muteButton.addEventListener("click", () => {
    setMuted(!audio.muted);
  });

  const savedVolume = readStore(VOLUME_KEY);
  if (savedVolume != null && Number.isFinite(Number(savedVolume))) {
    setVolume(Number(savedVolume));
  } else {
    setVolume(DEFAULT_VOLUME);
  }

  function switchTrack(delta: number) {
    if (tracks.length < 2) {
      audio.currentTime = 0;
      return;
    }
    const wasPlaying = !audio.paused;
    index = (index + delta + tracks.length) % tracks.length;
    loadTrack();
    if (wasPlaying) play();
  }

  prevButton.addEventListener("click", () => switchTrack(-1));
  nextButton.addEventListener("click", () => switchTrack(1));

  if (tracks.length < 2) {
    prevButton.hidden = true;
    nextButton.hidden = true;
  }

  function setExpanded(expanded: boolean) {
    expand.setAttribute("aria-expanded", String(expanded));
    expand.setAttribute(
      "aria-label",
      expanded ? "Collapse player" : "Expand player",
    );
    root.dataset.collapsed = String(!expanded);
    panel.hidden = !expanded;
  }

  expand.addEventListener("click", () => {
    setExpanded(expand.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && expand.getAttribute("aria-expanded") === "true") {
      setExpanded(false);
      expand.focus();
    }
  });

  loadTrack();
}