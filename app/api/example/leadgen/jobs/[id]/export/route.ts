import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";

// Helper: Format matched cases as "Title: link" per line
const formatMatchedCases = (matchedCaseIds: string | null): string => {
  if (!matchedCaseIds) return "";
  try {
    const parsed = JSON.parse(matchedCaseIds);
    return parsed
      .map((item: any) => {
        if (typeof item === "string") {
          // Legacy format: just title string
          return item;
        }
        // New format: {title, link} object
        return item.link ? `${item.title}: ${item.link}` : item.title;
      })
      .join("\n");
  } catch {
    return "";
  }
};

// Helper: Build comprehensive research context column
const buildResearchContext = (record: any): string => {
  const sections: string[] = [];

  // Section 1: Client Specification (extra columns from rawData)
  if (record.rawData) {
    try {
      const rawData = JSON.parse(record.rawData);
      const standardFields = [
        "Company Name",
        "LinkedIn Link",
        "First Name",
        "Last Name",
        "Job Title",
      ];
      const extraFields = Object.entries(rawData)
        .filter(([key]) => !standardFields.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      if (extraFields) {
        sections.push(`=== CLIENT SPECIFICATION ===\n${extraFields}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Section 2: News with Citations
  if (record.companyNews) {
    try {
      const news = JSON.parse(record.companyNews);
      if (Array.isArray(news) && news.length > 0) {
        const newsItems = news
          .map((item: any) => {
            const title = item.title || "Untitled";
            const summary = item.summary || "";
            const source = item.source || "";
            return `${title} - ${summary} [${source}]`;
          })
          .join("\n\n");
        if (newsItems) {
          sections.push(`=== RECENT NEWS ===\n${newsItems}`);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return sections.join("\n\n");
};

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

    // Prepare data for Excel export
    const headers = [
      "Company Name",
      "LinkedIn Link",
      "First Name",
      "Last Name",
      "Job Title",
      "LinkedIn Message 1",
      "LinkedIn Message 2",
      "LinkedIn Message 3",
      "Company Region",
      "Company Industry",
      "Matched Cases",
      "Research Context",
      "Processing Status",
      "Error Message",
      "Research Summary",
    ];

    const rows = records.map((record) => {
      // Parse research summary
      let researchSummary = "";
      if (record.researchData) {
        try {
          const research = JSON.parse(record.researchData);
          researchSummary = research.researchSummary || research.error || "";
        } catch (e) {
          researchSummary = record.researchData;
        }
      }

      return [
        record.companyName,
        record.linkedinLink || "",
        record.firstName,
        record.lastName,
        record.jobTitle || "",
        record.message1 || "",
        record.message2 || "",
        record.message3 || "",
        record.companyRegion || "",
        record.companyIndustry || "",
        formatMatchedCases(record.matchedCaseIds),
        buildResearchContext(record),
        record.status,
        record.errorMessage || "",
        researchSummary,
      ];
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Apply formatting
    // Set header row style (bold with gray background)
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D3D3D3" } },
      };
    }

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // Company Name
      { wch: 40 }, // LinkedIn Link
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Job Title
      { wch: 100 }, // LinkedIn Message 1
      { wch: 100 }, // LinkedIn Message 2
      { wch: 100 }, // LinkedIn Message 3
      { wch: 20 }, // Company Region
      { wch: 25 }, // Company Industry
      { wch: 60 }, // Matched Cases (title: link per line)
      { wch: 80 }, // Research Context (client spec + news)
      { wch: 15 }, // Processing Status
      { wch: 40 }, // Error Message
      { wch: 60 }, // Research Summary
    ];

    // Enable text wrapping for message columns, matched cases, research context, error message, and research summary
    const wrapColumns = [5, 6, 7, 10, 11, 13, 14]; // Messages, matched cases, research context, error, research summary (0-indexed)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      wrapColumns.forEach((C) => {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) return;
        worksheet[address].s = {
          alignment: { wrapText: true, vertical: "top" },
        };
      });
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    // Generate Excel file buffer with cell styles enabled
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true,
    });

    // Return the file as a downloadable response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${job.filename || "results.xlsx"}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting results:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 },
    );
  }
}
