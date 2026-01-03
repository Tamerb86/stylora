import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    globals: true,
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/i18n/**/*.test.ts",
    ],
    // Server tests use node environment by default
    // Client tests override with happy-dom via inline config
    environment: "node",
    environmentMatchGlobs: [
      // Client tests use happy-dom for DOM APIs
      ["client/**/*.test.ts", "happy-dom"],
      ["client/**/*.spec.ts", "happy-dom"],
      // Server tests use node environment
      ["server/**/*.test.ts", "node"],
      ["server/**/*.spec.ts", "node"],
    ],
  },
});
