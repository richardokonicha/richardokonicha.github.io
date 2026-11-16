/**
 * Tailwind v4 runs as a PostCSS plugin rather than through the Vite plugin,
 * because Next builds with Turbopack. `dither-plugin` is imported from CSS
 * (see src/app/globals.css) and needs no bundler integration.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;