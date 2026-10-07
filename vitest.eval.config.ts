import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { alias } from "./vitest.config";

// Live model evaluations. They call the real APIs and cost money, so they only
// run on request: npm run eval:extraction
export default defineConfig({
  resolve: {
    alias: { ...alias, "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/eval/**/*.eval.ts"],
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
