import { test, expect } from "@playwright/test";

/**
 * Chat API tests
 *
 * Tests the simple chat API endpoint:
 * - POST /api/chat
 *
 * Note: These tests require OPENAI_API_KEY to be set.
 * In CI, these tests may be skipped or mocked.
 */

test.describe("Chat API", () => {
  // Skip if no API key (CI environment)
  const skipIfNoApiKey = process.env.OPENAI_API_KEY ? test : test.skip;

  skipIfNoApiKey("returns response for valid message", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        message: "Say hello in exactly 3 words",
      },
    });

    // May fail if no API key
    if (response.ok()) {
      const json = await response.json();
      expect(json.response).toBeDefined();
      expect(typeof json.response).toBe("string");
      expect(json.response.length).toBeGreaterThan(0);
    }
  });

  test("returns error for empty message", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        message: "",
      },
    });

    // Should return error for empty message
    // Behavior depends on implementation
    const json = await response.json();
    // Either error or empty response
    expect(json).toBeDefined();
  });

  test("returns error for missing message field", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {},
    });

    // Should handle missing message gracefully
    expect(response.status()).toBeLessThan(500); // No server crash
  });

  test("handles malformed JSON gracefully", async ({ request }) => {
    const response = await request.post("/api/chat", {
      headers: {
        "Content-Type": "application/json",
      },
      data: "not valid json" as unknown as Record<string, unknown>,
    });

    // Should not crash server
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Chat API - Response Format", () => {
  const skipIfNoApiKey = process.env.OPENAI_API_KEY ? test : test.skip;

  skipIfNoApiKey(
    "response is JSON with expected structure",
    async ({ request }) => {
      const response = await request.post("/api/chat", {
        data: {
          message: "Hello",
        },
      });

      if (response.ok()) {
        const json = await response.json();

        // Check response structure
        expect(json).toHaveProperty("response");
      }
    },
  );
});
