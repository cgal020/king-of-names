import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

// Tests that hit the real Supabase project in .env.local.
export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/integration/**/*.test.ts"],
      passWithNoTests: false,
      testTimeout: 30_000,
      hookTimeout: 60_000,
      fileParallelism: false,
    },
  }),
);
