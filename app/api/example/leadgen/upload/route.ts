import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const REQUIRED_COLUMNS = [
  "Company Name",
  "LinkedIn Link",
  "First Name",
  "Last Name",
  "Job Title",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 500;

interface OpportunityRow {
  companyName: string;
  linkedinLink: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  [key: string]: any;
}

interface ValidationError {
  type: "error" | "warning";
  message: string;
  row?: number;
  column?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only Excel files (.xlsx, .xls) are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds 10 MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB`,
        },
        { status: 400 },
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to parse Excel file. File may be corrupted or invalid",
        },
        { status: 400 },
      );
    }

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json(
        { error: "Excel file has no sheets" },
        { status: 400 },
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: "Excel file has no data rows" },
        { status: 400 },
      );
    }

    // Check for required columns
    const firstRow = rawData[0];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !actualColumns.includes(col),
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required column${missingColumns.length > 1 ? "s" : ""}: ${missingColumns.join(", ")}`,
          missingColumns,
        },
        { status: 400 },
      );
    }

    // Validate row count
    if (rawData.length > MAX_ROWS) {
      return NextResponse.json(
        {
          error: `File has too many rows (${rawData.length}). Maximum is ${MAX_ROWS} rows`,
        },
        { status: 400 },
      );
    }

    // Validate and transform data
    const opportunities: OpportunityRow[] = [];
    const validationErrors: ValidationError[] = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (1-indexed + header row)

      // Check required fields are not empty
      const missingFields: string[] = [];

      if (!row["Company Name"]?.toString().trim()) {
        missingFields.push("Company Name");
      }
      if (!row["First Name"]?.toString().trim()) {
        missingFields.push("First Name");
      }
      if (!row["Last Name"]?.toString().trim()) {
        missingFields.push("Last Name");
      }

      if (missingFields.length > 0) {
        validationErrors.push({
          type: "error",
          message: `Missing required fields: ${missingFields.join(", ")}`,
          row: rowNumber,
        });
        return; // Skip this row
      }

      // Warn about optional fields
      if (!row["LinkedIn Link"]?.toString().trim()) {
        validationErrors.push({
          type: "warning",
          message: "LinkedIn Link is empty",
          row: rowNumber,
          column: "LinkedIn Link",
        });
      }

      if (!row["Job Title"]?.toString().trim()) {
        validationErrors.push({
          type: "warning",
          message: "Job Title is empty",
          row: rowNumber,
          column: "Job Title",
        });
      }

      // Add to opportunities
      opportunities.push({
        companyName: row["Company Name"].toString().trim(),
        linkedinLink: row["LinkedIn Link"]?.toString().trim() || "",
        firstName: row["First Name"].toString().trim(),
        lastName: row["Last Name"].toString().trim(),
        jobTitle: row["Job Title"]?.toString().trim() || "",
        ...row, // Include all other columns as raw data
      });
    });

    // Check if we have any valid opportunities
    if (opportunities.length === 0) {
      return NextResponse.json(
        {
          error: "No valid opportunities found in file",
          validationErrors,
        },
        { status: 400 },
      );
    }

    // Save file to uploads directory
    const uploadId = uuidv4();
    const uploadsDir = join(process.cwd(), "uploads");

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filename = `${uploadId}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    // Return parsed data and validation results
    return NextResponse.json({
      success: true,
      uploadId,
      filename: file.name,
      filepath: filename,
      totalRows: rawData.length,
      validRows: opportunities.length,
      opportunities: opportunities.slice(0, 10), // Return first 10 for preview
      validationErrors: validationErrors.slice(0, 20), // Return first 20 errors
      hasMoreErrors: validationErrors.length > 20,
      columns: actualColumns,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error during file upload" },
      { status: 500 },
    );
  }
}
