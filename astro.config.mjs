import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  trailingSlash: "ignore",
  image: {
    domains: ["cdn.sanity.io"],
  },
  integrations: [
    react(),
    sanity({
      projectId: "a7b3q6z9",
      dataset: "production",
      useCdn: false,
      studioBasePath: "/studio",
      sanityConfig: "./sanity.config.ts",
    }),
  ],
});