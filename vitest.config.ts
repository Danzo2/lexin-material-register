import { defineConfig } from "vitest/config";

// Two projects so only the API tests pay for (and need) a database.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["packages/*/src/**/*.test.ts", "apps/web/src/**/*.test.{ts,tsx}"],
        },
      },
      {
        test: {
          name: "api",
          include: ["apps/api/src/**/*.test.ts"],
          globalSetup: ["apps/api/src/test/global-setup.ts"],
        },
      },
    ],
  },
});
