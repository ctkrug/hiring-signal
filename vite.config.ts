import { defineConfig } from "vitest/config";

// Relative asset paths (no leading "/") so the built site works when hosted
// under a subpath, e.g. apps.charliekrug.com/hiring-signal.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
