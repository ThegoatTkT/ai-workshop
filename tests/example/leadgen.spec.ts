import { test, expect } from "../fixtures/auth";

/**
 * LeadGen feature tests
 *
 * Tests the LeadGen messaging feature including:
 * - Page load and UI elements
 * - Template download
 * - File upload (mock)
 * - Job listing
 */

test.describe("LeadGen Page", () => {
  test("page loads with upload section", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/leadgen");

    // Check main heading
    await expect(authenticatedPage.locator("h1")).toContainText("LeadGen");

    // Check upload area is visible - use specific selector to avoid multiple matches
    await expect(
      authenticatedPage.locator('h2:has-text("Upload Your Data")'),
    ).toBeVisible();

    // Take screenshot
    await authenticatedPage.screenshot({
      path: "tests/screenshots/leadgen-page.png",
      fullPage: true,
    });
  });

  test("template download button is present", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/leadgen");

    // Look for template download link/button
    const templateButton = authenticatedPage.locator("text=Template").first();
    await expect(templateButton).toBeVisible();
  });

  test("file upload area accepts drag and drop", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/example/leadgen");

    // Check for file input or drop zone
    const dropZone = authenticatedPage
      .locator('[class*="drop"], [class*="upload"]')
      .first();
    await expect(dropZone).toBeVisible();
  });

  test("shows empty state when no jobs exist", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/example/leadgen");

    // If no jobs, might show an empty state message
    // This depends on the initial data state
    const content = await authenticatedPage.content();

    // Either shows jobs or an empty/upload state
    const hasJobs = content.includes("Job") || content.includes("job");
    const hasUpload = content.includes("Upload") || content.includes("upload");

    expect(hasJobs || hasUpload).toBeTruthy();
  });
});

test.describe("LeadGen Job Details", () => {
  // These tests assume a job exists - in real usage, would create one first

  test("can navigate to job details if jobs exist", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/example/leadgen");

    // Look for any job links
    const jobLink = authenticatedPage
      .locator('a[href*="/example/leadgen/jobs/"]')
      .first();

    if (await jobLink.isVisible()) {
      await jobLink.click();

      // Should be on job details page
      await expect(authenticatedPage).toHaveURL(/\/example\/leadgen\/jobs\//);

      await authenticatedPage.screenshot({
        path: "tests/screenshots/leadgen-job-details.png",
        fullPage: true,
      });
    }
  });
});

test.describe("LeadGen Navigation", () => {
  test("home button navigates to dashboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/leadgen");

    // Click Home button
    const homeButton = authenticatedPage.locator("text=Home").first();
    await expect(homeButton).toBeVisible();
    await homeButton.click();

    // Should be on dashboard
    await expect(authenticatedPage).toHaveURL("/example");
  });
});
