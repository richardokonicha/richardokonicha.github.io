/**
 * Run the whole QA harness against a fresh static export.
 *
 *   npm run qa              build if out/ is missing, then run every suite
 *   npm run qa -- --build   force a rebuild first
 *   npm run qa -- layout    run one suite
 *
 * Headless Chrome reports prefers-reduced-motion: reduce unless told otherwise,
 * so every suite sets the media feature explicitly rather than inheriting it.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SUITES = [
  ["layout", "./layout.mjs", "viewports, themes, cord, player, nav"],
  ["contrast", "./contrast.mjs", "WCAG AA on every text node"],
  ["motion", "./motion.mjs", "idle tug, sleeping rAF loops"],
  ["keys", "./keys.mjs", "sliders, tab order, scroll spy"],
];

const argv = process.argv.slice(2);
const forceBuild = argv.includes("--build");
const only = argv.filter((arg) => !arg.startsWith("--"));

function build() {
  console.log("building out/ …");
  return new Promise((done) => {
    const child = spawn("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => done(code === 0));
  });
}

if (forceBuild || !existsSync(join(root, "out", "index.html"))) {
  if (!(await build())) {
    console.error("build failed");
    process.exit(1);
  }
}

const selected = only.length
  ? SUITES.filter(([name]) => only.includes(name))
  : SUITES;

if (selected.length === 0) {
  console.error(`unknown suite. choose from: ${SUITES.map(([name]) => name).join(", ")}`);
  process.exit(1);
}

let ok = true;
for (const [name, file, blurb] of selected) {
  console.log(`\n=== ${name} — ${blurb} ===`);
  const suite = await import(file);
  const passed = await suite.main();
  if (!passed) ok = false;
}

console.log(ok ? "\nall suites passed" : "\nsome checks failed");
process.exit(ok ? 0 : 1);