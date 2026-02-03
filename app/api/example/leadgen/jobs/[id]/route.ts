import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";
import { eq, and, sql, lt } from "drizzle-orm";

export async function GET(
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

    // Get job
    const jobResult = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.userId, user.userId)))
      .limit(1);

    if (jobResult.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobResult[0];

    // Calculate processing statistics with full status breakdown
    const recordsResult = await db
      .select({
        avgProcessingTime: sql<number>`AVG(${processingRecords.processingTimeMs})`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${processingRecords.status} = 'pending' THEN 1 END)`,
        processingCount: sql<number>`COUNT(CASE WHEN ${processingRecords.status} = 'processing' THEN 1 END)`,
        completedCount: sql<number>`COUNT(CASE WHEN ${processingRecords.status} = 'completed' THEN 1 END)`,
        failedCount: sql<number>`COUNT(CASE WHEN ${processingRecords.status} = 'failed' THEN 1 END)`,
      })
      .from(processingRecords)
      .where(eq(processingRecords.jobId, jobId));

    const stats = recordsResult[0];
    const avgProcessingTimeMs = stats?.avgProcessingTime || 0;
    const pendingRecords = stats?.pendingCount || 0;
    const processingRecordsCount = stats?.processingCount || 0;
    const completedRecords = stats?.completedCount || 0;
    const failedRecords = stats?.failedCount || 0;

    // Calculate queue position for pending jobs
    let queuePosition = 0;
    if (job.status === "pending") {
      const queueResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(jobs)
        .where(
          and(
            eq(jobs.userId, user.userId),
            eq(jobs.status, "pending"),
            lt(jobs.createdAt, job.createdAt || new Date().toISOString()),
          ),
        );
      queuePosition = (queueResult[0]?.count || 0) + 1;
    }

    // Calculate estimated time remaining
    let estimatedTimeRemainingMs = 0;
    if (job.status === "processing" && avgProcessingTimeMs > 0) {
      const remainingRecords =
        (job.totalRecords || 0) - (job.processedRecords || 0);
      estimatedTimeRemainingMs = remainingRecords * avgProcessingTimeMs;
    }

    // Calculate processing speed (records per minute)
    let recordsPerMinute = 0;
    if (job.status === "processing" && avgProcessingTimeMs > 0) {
      recordsPerMinute = Math.round((60000 / avgProcessingTimeMs) * 10) / 10; // Round to 1 decimal
    }

    return NextResponse.json({
      job: job,
      stats: {
        avgProcessingTimeMs,
        estimatedTimeRemainingMs,
        recordsPerMinute,
        queuePosition,
        // Full status breakdown
        pendingRecords,
        processingRecords: processingRecordsCount,
        completedRecords,
        failedRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Get the job
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

    // Prevent deletion of actively processing jobs
    if (job.status === "processing") {
      return NextResponse.json(
        { error: "Cannot delete job while processing. Cancel it first." },
        { status: 400 },
      );
    }

    // Delete the job (cascade will handle processing_records)
    await db.delete(jobs).where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 },
    );
  }
}
