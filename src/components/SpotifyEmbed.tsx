"use client";

import * as React from "react";

export default function SpotifyEmbed() {
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [theme, setTheme] = React.useState<"0" | "1">("0");
  const [compact, setCompact] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ id: number; dx: number; dy: number } | null>(null);
  const manualRef = React.useRef(false);

  const clamp = (x: number, y: number) => {
    const w = ref.current?.offsetWidth ?? 300;
    const h = ref.current?.offsetHeight ?? 152;
    const pad = 8;
    return {
      x: Math.min(Math.max(x, pad), Math.max(pad, window.innerWidth - w - pad)),
      y: Math.min(Math.max(y, pad), Math.max(pad, window.innerHeight - h - pad)),
    };
  };

  const bottomRight = () => {
    const w = ref.current?.offsetWidth ?? 300;
    const h = ref.current?.offsetHeight ?? 152;
    return clamp(window.innerWidth - w - 16, window.innerHeight - h - 16);
  };
  const topLeft = () => clamp(16, 16);

  React.useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "0" : "1");
    syncTheme();
    const mo = new MutationObserver(syncTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  React.useEffect(() => {
    const update = () => {
      const isCompact = window.scrollY > 120;
      setCompact(isCompact);
      if (manualRef.current) return;
      setPos(isCompact ? topLeft() : bottomRight());
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    manualRef.current = true;
    dragRef.current = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
    ref.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    setPos(clamp(e.clientX - d.dx, e.clientY - d.dy));
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    window.setTimeout(() => { manualRef.current = false; }, 1500);
  };

  const w = 280;
  const h = 80;
  const style = { left: pos.x, top: pos.y };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ ...style, position: "fixed", zIndex: 60, cursor: "grab", touchAction: "none", transition: "left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease", opacity: 0.55 }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
    >
      <iframe
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        height={h}
        loading="lazy"
        src={`https://open.spotify.com/embed/playlist/5yKBDNBJGJ51f6bCMnPuZN?utm_source=generator&theme=${theme}`}
        style={{ border: 0, display: "block" }}
        title="Spotify playlist"
        width={w}
      />
    </div>
  );
}