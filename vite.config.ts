import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/ccwebtest/",
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
