import { test, expect } from "@playwright/test";

/**
 * Smoke tests - Basic verification that all pages load correctly
 *
 * These tests verify the application is running and pages render.
 * Run these before committing to catch obvious issues.
 */

test.describe("Smoke Tests - Public Pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/AI Sales Workshop/);

    // Check main content is visible
    await expect(page.locator("h1")).toContainText("AI Sales Workshop");

    // Take screenshot for verification
    await page.screenshot({
      path: "tests/screenshots/home.png",
      fullPage: true,
    });
  });

  test("example login page loads", async ({ page }) => {
    await page.goto("/example/login");

    // Check login form is present
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/login.png" });
  });

  test("call assistant page loads", async ({ page }) => {
    await page.goto("/call-assistant");

    // Check page content
    await expect(page.locator("h1")).toContainText("Call Center Assistant");

    await page.screenshot({
      path: "tests/screenshots/call-assistant.png",
      fullPage: true,
    });
  });

  test("post-sales page loads", async ({ page }) => {
    await page.goto("/post-sales");

    // Check page content
    await expect(page.locator("h1")).toContainText("Post-Sales Assistant");

    await page.screenshot({
      path: "tests/screenshots/post-sales.png",
      fullPage: true,
    });
  });
});

test.describe("Smoke Tests - Protected Pages (require login)", () => {
  // These tests first login, then check the pages

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/example/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/example");
  });

  test("example dashboard loads after login", async ({ page }) => {
    await expect(page.locator("text=LeadGen")).toBeVisible();
    await expect(page.locator("text=ICP Quiz")).toBeVisible();
    // Dashboard doesn't have "Audio Demo" text - it has LeadGen and ICP Quiz cards
    // The third card says "Coming Soon"
    await expect(page.locator("text=Coming Soon")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/example-dashboard.png",
      fullPage: true,
    });
  });

  test("leadgen page loads", async ({ page }) => {
    await page.goto("/example/leadgen");

    await expect(page.locator("h1")).toContainText("LeadGen");

    await page.screenshot({
      path: "tests/screenshots/leadgen.png",
      fullPage: true,
    });
  });

  test("icp quiz page loads", async ({ page }) => {
    await page.goto("/example/icp-quiz");

    await expect(page.locator("h1")).toContainText("ICP");

    await page.screenshot({
      path: "tests/screenshots/icp-quiz.png",
      fullPage: true,
    });
  });

  test("audio demo page loads", async ({ page }) => {
    await page.goto("/example/audio-demo");

    // Actual heading is "Post-Sales Call Processor"
    await expect(page.locator("h1")).toContainText("Post-Sales Call Processor");

    await page.screenshot({
      path: "tests/screenshots/audio-demo.png",
      fullPage: true,
    });
  });

  test("admin users page loads", async ({ page }) => {
    await page.goto("/example/admin/users");

    // Admin layout has h1 "Admin Panel", page content has h2 "User Management"
    await expect(page.locator("h1")).toContainText("Admin Panel");
    await expect(page.locator("h2")).toContainText("User Management");

    await page.screenshot({
      path: "tests/screenshots/admin-users.png",
      fullPage: true,
    });
  });

  test("admin settings page loads", async ({ page }) => {
    await page.goto("/example/admin/settings");

    // Admin layout has h1 "Admin Panel", page content has h2 "System Settings"
    await expect(page.locator("h1")).toContainText("Admin Panel");
    await expect(page.locator("h2")).toContainText("System Settings");

    await page.screenshot({
      path: "tests/screenshots/admin-settings.png",
      fullPage: true,
    });
  });
});
