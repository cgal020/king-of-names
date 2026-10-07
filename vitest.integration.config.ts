import { defineConfig } from "vitest/config";
import { alias } from "./vitest.config";

// Tests that hit the real Supabase project in .env.local.
export default defineConfig({
  resolve: { alias },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
