import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const jobId = id;

    // Fetch job
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).get();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch all processing records for this job
    const records = await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.jobId, jobId))
      .all();

    // Note: matchedCaseIds now contains full case objects [{title, link}, ...]
    // No need to lookup cases from database - data is self-contained

    return NextResponse.json({
      job: {
        id: job.id,
        filename: job.filename,
        status: job.status,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords,
        createdAt: job.createdAt,
      },
      records: records.map((record) => ({
        id: record.id,
        status: record.status,
        companyName: record.companyName,
        linkedinLink: record.linkedinLink,
        firstName: record.firstName,
        lastName: record.lastName,
        jobTitle: record.jobTitle,
        companyRegion: record.companyRegion,
        companyIndustry: record.companyIndustry,
        companyNews: record.companyNews,
        message1: record.message1,
        message2: record.message2,
        message3: record.message3,
        matchedCaseIds: record.matchedCaseIds,
        selectedNewsIndices: record.selectedNewsIndices,
        selectedCaseIndices: record.selectedCaseIndices,
        appliedRegionalTone: record.appliedRegionalTone,
        researchData: record.researchData,
        processingTimeMs: record.processingTimeMs,
        errorMessage: record.errorMessage,
      })),
      cases: {}, // Empty - case data is now in matchedCaseIds directly
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 },
    );
  }
}
