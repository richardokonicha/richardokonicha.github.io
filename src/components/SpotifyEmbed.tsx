"use client";

import * as React from "react";

export default function SpotifyEmbed() {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ id: number; dx: number; dy: number } | null>(null);

  const clamp = (x: number, y: number) => {
    const w = ref.current?.offsetWidth ?? 300;
    const h = ref.current?.offsetHeight ?? 152;
    const pad = 8;
    return {
      x: Math.min(Math.max(x, pad), Math.max(pad, window.innerWidth - w - pad)),
      y: Math.min(Math.max(y, pad), Math.max(pad, window.innerHeight - h - pad)),
    };
  };

  React.useEffect(() => {
    setPos(clamp(16, 16));
    const onResize = () => {
      const c = pos;
      if (c) setPos(clamp(c.x, c.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
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
  };

  const style = pos ? { left: pos.x, top: pos.y } : { left: 16, top: 16 };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ ...style, position: "fixed", zIndex: 60, cursor: "grab", touchAction: "none" }}
    >
      <iframe
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        height={152}
        loading="lazy"
        src="https://open.spotify.com/embed/playlist/5yKBDNBJGJ51f6bCMnPuZN?utm_source=generator&theme=0"
        style={{ border: 0, display: "block" }}
        title="Spotify playlist"
        width={300}
      />
    </div>
  );
}