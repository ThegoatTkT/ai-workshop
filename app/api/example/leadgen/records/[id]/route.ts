import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";

export async function PATCH(
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

    const recordId = id;

    // Parse request body
    const body = await request.json();
    const { message1, message2, message3, appliedRegionalTone } = body;

    // Validate at least one updatable field is provided
    if (
      message1 === undefined &&
      message2 === undefined &&
      message3 === undefined &&
      appliedRegionalTone === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "At least one field (message1, message2, message3, or appliedRegionalTone) is required",
        },
        { status: 400 },
      );
    }

    // Get the processing record
    const [record] = await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.id, recordId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Verify ownership through the job
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, record.jobId))
      .limit(1);

    if (!job || job.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build updates object with only provided fields
    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (message1 !== undefined) {
      updates.message1 = message1;
    }
    if (message2 !== undefined) {
      updates.message2 = message2;
    }
    if (message3 !== undefined) {
      updates.message3 = message3;
    }
    if (appliedRegionalTone !== undefined) {
      updates.appliedRegionalTone = appliedRegionalTone;
    }

    // Perform the update
    await db
      .update(processingRecords)
      .set(updates)
      .where(eq(processingRecords.id, recordId));

    // Fetch and return the updated record
    const [updatedRecord] = await db
      .select({
        id: processingRecords.id,
        message1: processingRecords.message1,
        message2: processingRecords.message2,
        message3: processingRecords.message3,
        appliedRegionalTone: processingRecords.appliedRegionalTone,
        updatedAt: processingRecords.updatedAt,
      })
      .from(processingRecords)
      .where(eq(processingRecords.id, recordId))
      .limit(1);

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
