"use client";

import { useEffect } from "react";

/**
 * The single client-side entry point.
 *
 * Everything on this site is static markup; the only JavaScript is progressive
 * enhancement — nav state, reveal-on-scroll, the Pretext line splits, the
 * particle field, the player and the opt-in `?qa=1` audit. Those modules are
 * written as plain DOM scripts and are pulled in here rather than imported at
 * module scope, because a client component is still evaluated on the server
 * during the static export, where `document` does not exist.
 */
export default function SiteBehaviour() {
  useEffect(() => {
    void import("@/scripts/behaviour");
    void import("@/scripts/qa");
  }, []);

  return null;
}