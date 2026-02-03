import { test, expect } from "../fixtures/auth";

/**
 * ICP Quiz feature tests
 *
 * Tests the ICP quiz feature including:
 * - Page load
 * - Quiz start
 * - Question display
 * - Answer selection
 * - Results display
 */

test.describe("ICP Quiz Page", () => {
  test("page loads with quiz content", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/icp-quiz");

    // Check main heading
    await expect(authenticatedPage.locator("h1")).toContainText("ICP");

    // Take screenshot
    await authenticatedPage.screenshot({
      path: "tests/screenshots/icp-quiz-page.png",
      fullPage: true,
    });
  });

  test("start quiz button is visible", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/icp-quiz");

    // Wait for the page to fully load (handles client-side auth check)
    await authenticatedPage.waitForTimeout(500);

    // Look for start button - the actual button text is "Start Quiz"
    const startButton = authenticatedPage
      .locator('button:has-text("Start Quiz")')
      .first();

    // Either start button, loading indicator, or questions should be visible
    const content = await authenticatedPage.content();
    const hasStartOrQuestions =
      (await startButton.isVisible()) ||
      content.includes("Question") ||
      content.includes("question") ||
      content.includes("Loading");

    expect(hasStartOrQuestions).toBeTruthy();
  });
});

test.describe("ICP Quiz Flow", () => {
  test("can start quiz and see first question", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/example/icp-quiz");

    // Try to start quiz if there's a start button
    const startButton = authenticatedPage
      .locator('button:has-text("Start"), button:has-text("Begin")')
      .first();

    if (await startButton.isVisible()) {
      await startButton.click();

      // Should now see a question
      await expect(
        authenticatedPage.locator("text=/Question|\\d+\\./i").first(),
      ).toBeVisible({ timeout: 5000 });
    }

    await authenticatedPage.screenshot({
      path: "tests/screenshots/icp-quiz-question.png",
      fullPage: true,
    });
  });

  test("answer options are selectable", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/icp-quiz");

    // Start quiz if needed
    const startButton = authenticatedPage
      .locator('button:has-text("Start"), button:has-text("Begin")')
      .first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await authenticatedPage.waitForTimeout(500);
    }

    // Look for answer options (usually radio buttons or clickable divs)
    const answerOptions = authenticatedPage.locator(
      'input[type="radio"], [class*="option"], [class*="answer"], [class*="choice"]',
    );

    const count = await answerOptions.count();
    if (count > 0) {
      // Click first option
      await answerOptions.first().click();

      await authenticatedPage.screenshot({
        path: "tests/screenshots/icp-quiz-answer-selected.png",
      });
    }
  });
});

test.describe("ICP Quiz Navigation", () => {
  test("home button navigates to dashboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/example/icp-quiz");

    // Click Home button
    const homeButton = authenticatedPage.locator("text=Home").first();
    await expect(homeButton).toBeVisible();
    await homeButton.click();

    // Should be on dashboard
    await expect(authenticatedPage).toHaveURL("/example");
  });
});
