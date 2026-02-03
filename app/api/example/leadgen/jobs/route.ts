import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (also checks user exists in DB)
    const user = await getUserFromRequestVerified(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, filename, filepath } = body;

    if (!uploadId || !filename || !filepath) {
      return NextResponse.json(
        { error: "Missing required fields: uploadId, filename, filepath" },
        { status: 400 },
      );
    }

    // Read and parse the uploaded file
    const fullPath = join(process.cwd(), "uploads", filepath);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(fullPath);
    } catch (error) {
      return NextResponse.json(
        { error: "Uploaded file not found" },
        { status: 404 },
      );
    }

    // Parse Excel
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Filter valid opportunities (those with required fields)
    const validOpportunities = rawData.filter((row) => {
      return (
        row["Company Name"]?.toString().trim() &&
        row["First Name"]?.toString().trim() &&
        row["Last Name"]?.toString().trim()
      );
    });

    if (validOpportunities.length === 0) {
      return NextResponse.json(
        { error: "No valid opportunities in file" },
        { status: 400 },
      );
    }

    // Create job
    const jobId = uuidv4();
    const now = new Date().toISOString();

    await db.insert(jobs).values({
      id: jobId,
      userId: user.userId,
      filename,
      filePath: filepath,
      status: "pending",
      totalRecords: validOpportunities.length,
      processedRecords: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create processing records for each opportunity
    const recordsToInsert = validOpportunities.map((row) => {
      return {
        id: uuidv4(),
        jobId,
        status: "pending" as const,
        companyName: row["Company Name"].toString().trim(),
        linkedinLink: row["LinkedIn Link"]?.toString().trim() || null,
        firstName: row["First Name"].toString().trim(),
        lastName: row["Last Name"].toString().trim(),
        jobTitle: row["Job Title"]?.toString().trim() || null,
        rawData: JSON.stringify(row),
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.insert(processingRecords).values(recordsToInsert);

    return NextResponse.json({
      success: true,
      jobId,
      totalRecords: validOpportunities.length,
      recordsCreated: validOpportunities.length,
    });
  } catch (error) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - List user's jobs
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (also checks user exists in DB)
    const user = await getUserFromRequestVerified(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's jobs, ordered by creation date
    const userJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, user.userId))
      .orderBy(jobs.createdAt)
      .limit(50);

    return NextResponse.json({
      jobs: userJobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
