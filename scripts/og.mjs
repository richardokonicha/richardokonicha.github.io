/**
 * Render tools/og.html to public/og.png with headless Chrome.
 *
 * The card is an artefact of the design tokens, not a drawing: after a colour
 * or type change in globals.css, run `npm run og` and commit the result.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findChrome } from "./lib/chrome.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "tools", "og.html");
const out = join(root, "public", "og.png");

const WIDTH = 1200;
const HEIGHT = 630;

let chrome;
try {
  chrome = findChrome();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const args = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  `--window-size=${WIDTH},${HEIGHT}`,
  "--virtual-time-budget=1500",
  `--screenshot=${out}`,
  `--user-data-dir=${join(root, "node_modules", ".cache", "og-chrome")}`,
  `file://${source}`,
];

const child = spawn(chrome, args, { stdio: "inherit" });
child.on("exit", (code) => {
  if (code === 0 && existsSync(out)) {
    console.log(`wrote ${out} (${WIDTH}×${HEIGHT})`);
    return;
  }
  console.error("render failed");
  process.exit(code ?? 1);
});