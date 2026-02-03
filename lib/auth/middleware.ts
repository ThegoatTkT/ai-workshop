import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  return token || null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// Async version that verifies user exists in database (prevents stale JWT issues after DB reset)
export async function getUserFromRequestVerified(
  request: NextRequest,
): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Verify user still exists in database
  const userExists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (userExists.length === 0) {
    return null; // User no longer exists - token is stale
  }

  return payload;
}

export function requireAuth(request: NextRequest): NextResponse | JWTPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function requireAdmin(request: NextRequest): NextResponse | JWTPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}
