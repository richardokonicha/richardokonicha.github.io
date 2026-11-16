// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://richardokonicha.github.io",
  output: "static",
  trailingSlash: "ignore",
  vite: {
    plugins: [tailwindcss()],
  },
});