import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/middleware";
import { getSetting, invalidateSettingsCache } from "@/lib/settings";
import { eq } from "drizzle-orm";

// GET /api/admin/settings/[key] - Get a single setting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { key } = await params;

    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch setting" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/settings/[key] - Update a setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { key } = await params;
    const body = await request.json();
    const { value } = body;

    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    // Check if setting exists
    const [existing] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    // Update the setting
    await db
      .update(systemSettings)
      .set({
        value: String(value),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(systemSettings.key, key));

    // Invalidate cache so processor picks up new values
    invalidateSettingsCache();

    // Fetch updated setting
    const [updated] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 },
    );
  }
}
