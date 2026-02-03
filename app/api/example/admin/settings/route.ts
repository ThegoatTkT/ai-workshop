import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getAllSettings, getSettingsByCategory } from "@/lib/settings";

// GET /api/admin/settings - List all settings
// Optional query param: ?category=prompts|general|agent
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let settings;
    if (category) {
      settings = await getSettingsByCategory(category);
    } else {
      settings = await getAllSettings();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}
