import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Define the required columns
    const headers = [
      "Company Name",
      "LinkedIn Link",
      "First Name",
      "Last Name",
      "Job Title",
    ];

    // Sample data row
    const sampleData = [
      "Acme Corp",
      "https://linkedin.com/company/acme-corp",
      "John",
      "Doe",
      "VP of Engineering",
    ];

    // Create the main data sheet
    const dataSheet = XLSX.utils.aoa_to_sheet([headers, sampleData]);

    // Set column widths for better readability
    dataSheet["!cols"] = [
      { wch: 20 }, // Company Name
      { wch: 40 }, // LinkedIn Link
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Job Title
    ];

    // Add the data sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Opportunities");

    // Create validation notes sheet
    const validationNotes = [
      ["Column Name", "Required", "Description", "Example"],
      ["Company Name", "Yes", "Name of the target company", "Acme Corp"],
      [
        "LinkedIn Link",
        "Yes",
        "LinkedIn URL for company page or contact profile",
        "https://linkedin.com/company/acme-corp",
      ],
      ["First Name", "Yes", "Contact's first name", "John"],
      ["Last Name", "Yes", "Contact's last name", "Doe"],
      [
        "Job Title",
        "Yes",
        "Contact's job title or position",
        "VP of Engineering",
      ],
      [],
      ["Important Notes:"],
      ["• Column names are case-sensitive and must match exactly"],
      ["• All columns are required"],
      ["• LinkedIn Link is used for research purposes"],
      [
        "• First Name and Last Name will be used in personalized LinkedIn messages",
      ],
      ["• Maximum 500 rows per file"],
      ["• Maximum file size: 10 MB"],
    ];

    const notesSheet = XLSX.utils.aoa_to_sheet(validationNotes);

    // Set column widths for validation notes
    notesSheet["!cols"] = [
      { wch: 20 }, // Column Name
      { wch: 12 }, // Required
      { wch: 50 }, // Description
      { wch: 40 }, // Example
    ];

    // Add the validation notes sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, notesSheet, "Validation Notes");

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="leadgen-template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 },
    );
  }
}
