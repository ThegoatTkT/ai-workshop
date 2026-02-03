import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult;
    const body = await request.json();
    const { username, password, role } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if username is taken by another user
    const usernameCheck = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (usernameCheck.length > 0 && usernameCheck[0].id !== id) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    const updates: any = {
      username,
      role: role || "user",
      updatedAt: new Date().toISOString(),
    };

    // Only update password if provided
    if (password) {
      updates.passwordHash = await hashPassword(password);
    }

    await db.update(users).set(updates).where(eq(users.id, id));

    const updatedUser = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        created_at: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult;

    // Prevent deleting own account
    if (currentUser.userId === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
