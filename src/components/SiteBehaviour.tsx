"use client";

import { useEffect } from "react";
import { initBehaviour } from "@/scripts/behaviour";

/**
 * The single client-side entry point.
 *
 * Everything on this site is static markup; the only JavaScript is progressive
 * enhancement — nav state, reveal-on-scroll, the Pretext line splits, the
 * particle field, the player and the opt-in `?qa=1` audit.
 */
export default function SiteBehaviour() {
  useEffect(() => {
    initBehaviour();
    /* The audit is a development tool: only download and run it when it was
       asked for, so ordinary visitors never pay for it. */
    if (new URLSearchParams(window.location.search).get("qa") === "1") {
      void import("@/scripts/qa");
    }
  }, []);

  /* Render a comment so Next.js doesn't optimise this client component away
     during static export. The comment has no visual impact. */
  return <>{/* site-behaviour */}</>;
}