import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
process.env.FLOWERS_TEST_PASSWORD ||= randomBytes(24).toString("base64url");
export default defineConfig({
  testDir: "./tests",
  use: {
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    },
    baseURL: "http://127.0.0.1:5180",
  },
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:5180/api/health",
    reuseExistingServer: false,
    env: { FLOWERS_TEST_PASSWORD: process.env.FLOWERS_TEST_PASSWORD },
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
});
