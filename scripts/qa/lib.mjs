/**
 * The QA harness: a static server over out/, a headless Chrome driven over
 * the DevTools protocol, and the small helpers every suite needs.
 *
 * Node builtins only — no Playwright, no Puppeteer, nothing to install.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { findChrome } from "../lib/chrome.mjs";

export { sleep };

export const ROOT = resolve(new URL("..", import.meta.url).pathname, "..", "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ico": "image/x-icon",
};

/**
 * Serve out/ the way a static host does.
 *
 * HTTP Range is honoured on purpose: the player seeks, and a server that
 * ignores Range makes the seek bar look broken in the harness.
 */
export function serve(root = ROOT) {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ""));
      const body = await readFile(file);
      const type = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
      const range = req.headers.range;
      if (range) {
        const match = /bytes=(\d*)-(\d*)/.exec(range);
        const start = match && match[1] ? Number(match[1]) : 0;
        const end =
          match && match[2]
            ? Math.min(Number(match[2]), body.length - 1)
            : body.length - 1;
        res.writeHead(206, {
          "content-type": type,
          "content-range": `bytes ${start}-${end}/${body.length}`,
          "accept-ranges": "bytes",
          "content-length": end - start + 1,
        });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, {
        "content-type": type,
        "accept-ranges": "bytes",
        "content-length": body.length,
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => {
      done({ server, port: server.address().port });
    });
  });
}

async function freePort() {
  const probe = createNetServer();
  await new Promise((done) => probe.listen(0, "127.0.0.1", done));
  const { port } = probe.address();
  await new Promise((done) => probe.close(done));
  return port;
}

/* -------------------------------------------------------------------------- */

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  send(method, params = {}) {
    const id = (this.id += 1);
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(listener) {
    this.listeners.add(listener);
  }
}

/* -------------------------------------------------------------------------- */

export class Harness {
  /**
   * @param {object} options
   * @param {number} [options.width]
   * @param {number} [options.height]
   * @param {"reduce"|"no-preference"} [options.reducedMotion]
   * @param {boolean} [options.mobile]
   * @param {string[]} [options.scripts] evaluated before any page script
   */
  static async open(options = {}) {
    const {
      width = 1440,
      height = 900,
      reducedMotion = "no-preference",
      mobile = false,
      scripts = [],
    } = options;

    const chrome = findChrome();
    const { server, port } = await serve();
    const cdpPort = await freePort();
    const profile = join(tmpdir(), `qa-chrome-${process.pid}-${cdpPort}`);

    const child = spawn(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--autoplay-policy=no-user-gesture-required",
        `--remote-debugging-port=${cdpPort}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );

    const json = async (path, method = "GET") =>
      (await fetch(`http://127.0.0.1:${cdpPort}${path}`, { method })).json();

    let target = null;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        await json("/json/version");
        target = await json("/json/new?about:blank", "PUT");
        break;
      } catch {
        await sleep(250);
      }
    }
    if (!target) {
      child.kill("SIGKILL");
      server.close();
      throw new Error("Chrome never answered on the DevTools port");
    }

    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const logs = [];
    cdp.on((message) => {
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        logs.push(
          message.params.args.map((arg) => arg.value ?? arg.description).join(" "),
        );
      }
      if (message.method === "Runtime.exceptionThrown") {
        logs.push(
          `EXC ${message.params.exceptionDetails.exception?.description ?? ""}`,
        );
      }
    });

    for (const source of scripts) {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source });
    }

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: reducedMotion }],
    });

    const harness = new Harness({ child, server, cdp, logs, port, width, height });
    return harness;
  }

  constructor({ child, server, cdp, logs, port, width, height }) {
    this.child = child;
    this.server = server;
    this.cdp = cdp;
    this.logs = logs;
    this.port = port;
    this.width = width;
    this.height = height;
    this.origin = `http://127.0.0.1:${port}`;
  }

  async ev(expression) {
    const { result } = await this.cdp.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result?.subtype === "error") throw new Error(result.description);
    return result?.value;
  }

  /** Navigate and wait for the document and the deferred scripts to settle. */
  async goto(path = "/") {
    await this.cdp.send("Page.navigate", { url: this.origin + path });
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if ((await this.ev("document.readyState")) === "complete") break;
      await sleep(200);
    }
    await sleep(1600);
  }

  async reload() {
    await this.cdp.send("Page.reload", { ignoreCache: true });
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if ((await this.ev("document.readyState")) === "complete") break;
      await sleep(200);
    }
    await sleep(1400);
  }

  async setViewport(width, height, mobile = width < 600) {
    await this.cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    this.width = width;
    this.height = height;
  }

  async setReducedMotion(value) {
    await this.cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value }],
    });
  }

  async clearStore() {
    await this.ev(`(()=>{try{localStorage.clear()}catch(e){};return 1})()`);
    await this.reload();
  }

  async key(key, code = key, virtualKey = 0) {
    await this.cdp.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      windowsVirtualKeyCode: virtualKey,
    });
    await this.cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      windowsVirtualKeyCode: virtualKey,
    });
  }

  async centerOf(selector) {
    const point = await this.ev(
      `(()=>{const n=document.querySelector(${JSON.stringify(selector)});` +
        `if(!n)return null;const r=n.getBoundingClientRect();` +
        `return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
    );
    if (!point) throw new Error(`no element for ${selector}`);
    return point;
  }

  async click(selector) {
    const point = await this.centerOf(selector);
    await this.mouse("mousePressed", point);
    await this.mouse("mouseReleased", point);
    return point;
  }

  async mouse(type, point, buttons = type === "mousePressed" ? 1 : 0) {
    await this.cdp.send("Input.dispatchMouseEvent", {
      type,
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
      buttons,
    });
  }

  async scrollThrough() {
    const height = await this.ev("document.documentElement.scrollHeight");
    for (let y = 0; y < height; y += 600) {
      await this.ev(`window.scrollTo(0, ${y})`);
      await sleep(220);
    }
    await this.ev("window.scrollTo(0,0)");
    await sleep(600);
  }

  async close() {
    this.child.kill("SIGKILL");
    this.cdp.ws.close();
    this.server.close();
  }
}

/* -------------------------------------------------------------------------- */

/** Collects PASS/FAIL lines and reports whether the suite held. */
export function reporter() {
  const rows = [];
  const check = (name, ok, detail = "") => {
    rows.push({ name, ok: Boolean(ok), detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
  };
  const summary = () => {
    const failed = rows.filter((row) => !row.ok);
    console.log(`\n${rows.length - failed.length}/${rows.length} checks passed`);
    return failed.length === 0;
  };
  return { check, rows, summary };
}