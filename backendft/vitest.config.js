import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { NODE_ENV: "test" },
    globalSetup: ["./tests/globalSetup.js"],
    // All test files share one database, so run them one after another
    fileParallelism: false,
    testTimeout: 15000,
  },
});
