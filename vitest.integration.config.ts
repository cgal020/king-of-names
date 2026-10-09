import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { alias } from "./vitest.config";

// Tests that hit the real Supabase project in .env.local, or the network.
export default defineConfig({
  resolve: {
    alias: { ...alias, "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
