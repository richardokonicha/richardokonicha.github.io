/**
 * Static export for GitHub Pages.
 *
 * - `output: "export"` writes a fully static site to `out/`; there is no Node
 *   runtime at serve time, which is all Pages gives us.
 * - `trailingSlash: true` emits `about/index.html` rather than `about.html`,
 *   because Pages only resolves a directory to its `index.html`. Without it,
 *   every route except `/` 404s.
 * - Images are served as-is. `next/image` optimisation needs a server, so it is
 *   switched off rather than left to fail at runtime.
 *
 * This is a user page repo (richardokonicha.github.io), so the site is served
 * from the root and needs no `basePath`.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  /* A stray package-lock.json lives in the parent directory, so Turbopack would
     otherwise treat that as the workspace root and warn on every build. Pinning
     the root keeps the build scoped to this repo. */
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;