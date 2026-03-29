import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "metrics/__tests__/**/*.test.ts"],
  },
});
