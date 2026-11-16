/**
 * Locate a Chrome/Chromium binary.
 *
 * Headless Chrome is the only browser the QA harness drives, so both the
 * screenshot script and the suite runner need to find it the same way.
 */

import { existsSync } from "node:fs";

const candidates = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean);

/** @returns {string} path to a browser binary */
export function findChrome() {
  const found = candidates.find((path) => existsSync(path));
  if (found) return found;
  throw new Error(
    "No Chrome/Chromium found. Set CHROME=/path/to/chrome and try again.",
  );
}