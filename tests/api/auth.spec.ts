import { test, expect } from "@playwright/test";

/**
 * Authentication API tests
 *
 * Tests the auth API endpoints:
 * - POST /api/example/auth/login
 * - POST /api/example/auth/logout
 * - GET /api/example/auth/me
 */

test.describe("Auth API - Login", () => {
  test("successful login returns user data and sets cookie", async ({
    request,
  }) => {
    const response = await request.post("/api/example/auth/login", {
      data: {
        username: "admin",
        password: "admin123",
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.user).toBeDefined();
    expect(json.user.username).toBe("admin");
    expect(json.user.role).toBe("admin");

    // Check that auth cookie is set
    const cookies = response.headers()["set-cookie"] || "";
    expect(cookies.includes("auth-token")).toBeTruthy();
  });

  test("login with wrong password returns 401", async ({ request }) => {
    const response = await request.post("/api/example/auth/login", {
      data: {
        username: "admin",
        password: "wrongpassword",
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);

    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  test("login with non-existent user returns 401", async ({ request }) => {
    const response = await request.post("/api/example/auth/login", {
      data: {
        username: "nonexistent",
        password: "password123",
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });

  test("login with missing credentials returns error", async ({ request }) => {
    const response = await request.post("/api/example/auth/login", {
      data: {},
    });

    expect(response.ok()).toBeFalsy();
  });
});

test.describe("Auth API - Me", () => {
  test("returns user data when authenticated", async ({ request }) => {
    // First login to get cookie
    const loginResponse = await request.post("/api/example/auth/login", {
      data: {
        username: "admin",
        password: "admin123",
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    // Now call /me endpoint (cookies are automatically included)
    const meResponse = await request.get("/api/example/auth/me");

    expect(meResponse.ok()).toBeTruthy();

    const json = await meResponse.json();
    expect(json.user).toBeDefined();
    expect(json.user.username).toBe("admin");
  });

  test("returns 401 when not authenticated", async ({ request, context }) => {
    // Clear cookies first
    await context.clearCookies();

    const response = await request.get("/api/example/auth/me");

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });
});

test.describe("Auth API - Logout", () => {
  test("logout clears auth cookie", async ({ request }) => {
    // First login
    await request.post("/api/example/auth/login", {
      data: {
        username: "admin",
        password: "admin123",
      },
    });

    // Logout
    const logoutResponse = await request.post("/api/example/auth/logout");

    expect(logoutResponse.ok()).toBeTruthy();

    // Check that cookie is cleared (set to expire)
    const cookies = logoutResponse.headers()["set-cookie"] || "";
    expect(cookies.includes("auth-token")).toBeTruthy();
  });

  test("after logout, /me returns 401", async ({ request }) => {
    // Login
    await request.post("/api/example/auth/login", {
      data: {
        username: "admin",
        password: "admin123",
      },
    });

    // Verify logged in
    const meBeforeLogout = await request.get("/api/example/auth/me");
    expect(meBeforeLogout.ok()).toBeTruthy();

    // Logout
    await request.post("/api/example/auth/logout");

    // Verify logged out
    const meAfterLogout = await request.get("/api/example/auth/me");
    expect(meAfterLogout.ok()).toBeFalsy();
  });
});
