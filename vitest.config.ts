import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export const alias = { "@": fileURLToPath(new URL(".", import.meta.url)) };

// Offline unit tests. Integration tests (vitest.integration.config.ts) and live
// model evals (vitest.eval.config.ts) have their own configs.
export default defineConfig({
  resolve: { alias },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    passWithNoTests: true,
  },
});
