import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = await getUserFromRequestVerified(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = id;

    // Get the current job
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if job belongs to the user
    if (job.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow cancellation of pending or processing jobs
    if (job.status !== "pending" && job.status !== "processing") {
      return NextResponse.json(
        { error: "Cannot cancel job with status: " + job.status },
        { status: 400 },
      );
    }

    // Update job status to cancelled
    await db
      .update(jobs)
      .set({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 },
    );
  }
}
