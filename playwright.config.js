const { defineConfig, devices } = require("@playwright/test");
const process = require("node:process");

const baseURL = process.env.E2E_BASE_URL || "https://garden-sitters.vercel.app";

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.smoke.spec.js",
  timeout: 300000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    actionTimeout: 30000,
    navigationTimeout: 60000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
