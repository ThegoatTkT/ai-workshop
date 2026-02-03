import { test as base, expect, Page } from "@playwright/test";

/**
 * Authentication fixture for Playwright tests
 *
 * Provides an authenticated page that has already logged in as admin.
 * Use this for testing protected pages that require authentication.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth'
 *
 *   test('protected page works', async ({ authenticatedPage }) => {
 *     await authenticatedPage.goto('/example/leadgen')
 *     // Page is already logged in
 *   })
 */

// Extend the base test with our custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto("/example/login");

    // Fill in credentials
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL("/example");

    // Verify we're logged in by checking for dashboard content
    await expect(page.locator("text=LeadGen")).toBeVisible();

    // Provide the authenticated page to the test
    await use(page);
  },
});

// Re-export expect for convenience
export { expect };

/**
 * Helper function to login programmatically via API
 * Useful for tests that need auth cookies but don't test the login flow
 */
export async function loginViaApi(
  page: Page,
  username = "admin",
  password = "admin123",
) {
  const response = await page.request.post("/api/example/auth/login", {
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  return response;
}

/**
 * Helper to check if a page is on the login page (redirected due to auth)
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  return page.url().includes("/example/login");
}
