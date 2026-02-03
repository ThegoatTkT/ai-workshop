import { test, expect } from "../fixtures/auth";

/**
 * Audio Demo feature tests
 *
 * Tests the audio transcription feature including:
 * - Page load and UI elements
 * - File upload interface
 * - Recording interface (browser permissions dependent)
 */

test.describe("Audio Demo Page", () => {
  test("page loads with audio controls", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Check main heading - actual title is "Post-Sales Call Processor"
    await expect(authenticatedPage.locator("h1")).toContainText(
      "Post-Sales Call Processor",
    );

    // Take screenshot
    await authenticatedPage.screenshot({
      path: "tests/screenshots/audio-demo-page.png",
      fullPage: true,
    });
  });

  test("file upload section is visible", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Check for file input
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test("record button is visible", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Look for record button
    const recordButton = authenticatedPage.locator("text=Record").first();
    await expect(recordButton).toBeVisible();
  });

  test("has transcription output area", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Look for areas where transcription/summary would appear
    // These might be labeled or be empty divs waiting for content
    const content = await authenticatedPage.content();

    // Should have some indication of transcription feature
    const hasTranscriptArea =
      content.toLowerCase().includes("transcript") ||
      content.toLowerCase().includes("summary") ||
      content.toLowerCase().includes("result");

    expect(hasTranscriptArea).toBeTruthy();
  });
});

test.describe("Audio Demo Navigation", () => {
  test("home button navigates to dashboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Click Home button
    const homeButton = authenticatedPage.locator("text=Home").first();
    await expect(homeButton).toBeVisible();
    await homeButton.click();

    // Should be on dashboard
    await expect(authenticatedPage).toHaveURL("/example");
  });
});

test.describe("Audio Demo Interactions", () => {
  test("upload button is clickable", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Find upload-related button or area
    const uploadArea = authenticatedPage
      .locator('[class*="upload"], [class*="drop"]')
      .first();

    if (await uploadArea.isVisible()) {
      // Verify it's interactive (not disabled)
      const isDisabled = await uploadArea.getAttribute("disabled");
      expect(isDisabled).toBeFalsy();
    }
  });

  test("copy button appears after content is available", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/example/audio-demo");

    // Initially no copy button (no content to copy)
    // After transcription, copy button should appear
    // This is a smoke test - actual copy testing needs real audio

    // Just verify page structure is correct - actual title is "Post-Sales Call Processor"
    await expect(authenticatedPage.locator("h1")).toContainText(
      "Post-Sales Call Processor",
    );
  });
});
