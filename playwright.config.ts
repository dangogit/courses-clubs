import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Load .env.local so Supabase keys are available in E2E tests
import { loadEnvConfig } from "@next/env";
loadEnvConfig(path.resolve(__dirname));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /.*\.unauth\.spec\.ts/,
    },
  ],

  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
