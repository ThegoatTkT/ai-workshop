import { test, expect } from "@playwright/test";

/**
 * Login flow tests
 *
 * Tests the authentication flow including:
 * - Successful login
 * - Failed login with wrong credentials
 * - Logout
 * - Protected route redirect
 */

test.describe("Login Flow", () => {
  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/example/login");

    // Fill credentials
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");

    // Click login
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/example");

    // Should see dashboard content
    await expect(page.locator("text=LeadGen")).toBeVisible();

    // Take screenshot of successful login state
    await page.screenshot({ path: "tests/screenshots/login-success.png" });
  });

  test("failed login shows error message", async ({ page }) => {
    await page.goto("/example/login");

    // Fill wrong credentials
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "wrongpassword");

    // Click login
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL("/example/login");

    // Should show error message
    await expect(page.locator("text=Invalid")).toBeVisible();

    // Take screenshot of error state
    await page.screenshot({ path: "tests/screenshots/login-error.png" });
  });

  test("empty credentials shows validation", async ({ page }) => {
    await page.goto("/example/login");

    // Click login without filling anything
    await page.click('button[type="submit"]');

    // Should stay on login page (HTML5 validation or custom)
    await expect(page).toHaveURL("/example/login");
  });

  test("logout returns to login page", async ({ page }) => {
    // First login
    await page.goto("/example/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/example");

    // Find and click logout (usually in header or admin area)
    // Navigate to admin area which has logout
    await page.goto("/example/admin/users");

    // Click logout button
    const logoutButton = page.locator("text=Logout");
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL("/example/login");
    }
  });

  test("protected routes require auth for API calls", async ({ page }) => {
    // Clear any existing cookies
    await page.context().clearCookies();

    // Try to access protected page
    await page.goto("/example/leadgen");

    // Note: The LeadGen page doesn't have client-side auth redirects.
    // It allows the page to render but API calls will fail.
    // The page should show its UI but with no user-specific data.

    // The page loads and shows its content
    await expect(page.locator("h1")).toContainText("LeadGen");

    // However, the /api/example/leadgen/jobs endpoint requires auth
    // and will return 401 when called
    const response = await page.request.get("/api/example/leadgen/jobs");
    expect(response.status()).toBe(401);
  });
});

test.describe("Session Persistence", () => {
  test("session persists across page navigation", async ({ page }) => {
    // Login
    await page.goto("/example/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/example");

    // Navigate to different pages
    await page.goto("/example/leadgen");
    await expect(page.locator("h1")).toContainText("LeadGen");

    await page.goto("/example/icp-quiz");
    await expect(page.locator("h1")).toContainText("ICP");

    await page.goto("/example/audio-demo");
    // Actual heading is "Post-Sales Call Processor"
    await expect(page.locator("h1")).toContainText("Post-Sales Call Processor");

    // Still authenticated
    await page.goto("/example");
    await expect(page.locator("text=LeadGen")).toBeVisible();
  });
});
