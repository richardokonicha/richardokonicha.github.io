"use client";

import * as React from "react";

export default function SpotifyEmbed() {
  const [theme, setTheme] = React.useState<"0" | "1">("0");
  const [opacity, setOpacity] = React.useState(1);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "0" : "1");
    syncTheme();
    const mo = new MutationObserver(syncTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  React.useEffect(() => {
    const update = () => {
      const hero = document.querySelector("section");
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : window.innerHeight;
      const visible = heroBottom > 120;
      setOpacity(visible ? 0.85 : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: 16, left: 16, zIndex: 60, opacity, transition: "opacity 0.3s ease", pointerEvents: opacity > 0 ? "auto" : "none" }}
    >
      <iframe
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        height={80}
        loading="lazy"
        src={`https://open.spotify.com/embed/playlist/5yKBDNBJGJ51f6bCMnPuZN?utm_source=generator&theme=${theme}`}
        style={{ border: 0, display: "block" }}
        title="Spotify playlist"
        width={280}
      />
    </div>
  );
}