import { NextRequest, NextResponse } from "next/server";
import { processPendingRecords } from "@/lib/agents/processor";

/**
 * Internal cron endpoint for processing pending records
 * This endpoint is called by the cron scheduler every minute
 *
 * Security: Protected by X-Cron-Secret header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("X-Cron-Secret");
    const expectedSecret = process.env.CRON_SECRET || "internal-cron-secret";

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process pending records
    const result = await processPendingRecords();

    return NextResponse.json({
      success: true,
      jobsProcessed: result.jobsProcessed,
      recordsProcessed: result.recordsProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron API] Error processing records:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
