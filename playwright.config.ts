import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Playwright configuration for AI Sales Workshop
 *
 * Run tests with:
 *   npm test              - Run all tests headless
 *   npm run test:headed   - Run with visible browser
 *   npm run test:ui       - Open Playwright UI
 *   npm run test:debug    - Debug mode with inspector
 */
export default defineConfig({
  testDir: "./tests",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Capture screenshot on failure
    screenshot: "only-on-failure",

    // Record video on failure
    video: "on-first-retry",
  },

  // Configure projects for browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: "npm run dev:next",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server to start
  },

  // Output folder for test artifacts
  outputDir: "test-results",

  // Timeout for each test
  timeout: 30 * 1000,

  // Timeout for each expect() assertion
  expect: {
    timeout: 5 * 1000,
  },
});
