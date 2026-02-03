"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Home } from "lucide-react";

interface ValidationError {
  type: "error" | "warning";
  message: string;
  row?: number;
  column?: string;
}

interface UploadResult {
  uploadId: string;
  filename: string;
  filepath: string;
  totalRows: number;
  validRows: number;
  opportunities: any[];
  validationErrors: ValidationError[];
  hasMoreErrors: boolean;
  columns: string[];
}

interface Job {
  id: string;
  filename: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  createdAt: string;
}

export default function LeadGenPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // Fetch recent jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/example/leadgen/jobs");
        if (response.ok) {
          const data = await response.json();
          // Sort by createdAt descending and take first 5
          const sortedJobs = (data.jobs || [])
            .sort(
              (a: Job, b: Job) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 5);
          setRecentJobs(sortedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/example/leadgen/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leadgen-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template");
    }
  };

  const uploadFile = async (file: File) => {
    // Client-side validation
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        `File size exceeds 10 MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB`,
      );
      return;
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadError(
        "Invalid file type. Only Excel files (.xlsx, .xls) are allowed",
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/example/leadgen/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      setUploadResult(data);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleConfirmAndProcess = async () => {
    if (!uploadResult) return;

    setIsCreatingJob(true);

    try {
      const response = await fetch("/api/example/leadgen/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId: uploadResult.uploadId,
          filename: uploadResult.filename,
          filepath: uploadResult.filepath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      // Redirect to job status page
      router.push(`/example/leadgen/jobs/${data.jobId}`);
    } catch (error) {
      console.error("Job creation error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to create job",
      );
      setIsCreatingJob(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    setDeletingJobId(jobToDelete.id);
    try {
      const response = await fetch(
        `/api/example/leadgen/jobs/${jobToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete job");
      }

      // Remove the job from the list
      setRecentJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      setShowDeleteDialog(false);
      setJobToDelete(null);
    } catch (err) {
      console.error("Error deleting job:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete job. Please try again.",
      );
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - White with shadow */}
      <div className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">
                  LeadGen Messaging
                </h1>
                <p className="text-sm text-muted-foreground">
                  Generate personalized LinkedIn messages using AI
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/example")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Instructions and Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions Panel */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 animate-fade-in">
              <h2 className="font-display text-lg font-bold text-foreground mb-4">
                How It Works
              </h2>
              <ol className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </span>
                  <span>
                    Download the Excel template and populate it with your
                    opportunity data
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </span>
                  <span>
                    Upload your file using the drag-and-drop zone below
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </span>
                  <span>
                    AI agents will research each prospect and generate
                    personalized LinkedIn messages
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-7 h-7 bg-accent/10 text-accent rounded-lg flex items-center justify-center text-xs font-bold mr-3">
                    4
                  </span>
                  <span>Review and export your LinkedIn message sequences</span>
                </li>
              </ol>
            </div>

            {/* Template Download */}
            <div
              className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-4">
                Step 1: Download Template
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Download the Excel template with required columns and sample
                data to get started.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="btn-primary cursor-pointer"
              >
                Download Template
              </button>
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">
                  Required columns:
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Company Name
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    LinkedIn Link
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    First Name
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Last Name
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Job Title
                  </li>
                </ul>
              </div>
            </div>

            {/* Upload Zone */}
            <div
              className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-4">
                Step 2: Upload Your Data
              </h2>

              {/* Error Message */}
              {uploadError && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in">
                  <p className="text-sm text-destructive font-medium">
                    {uploadError}
                  </p>
                </div>
              )}

              {/* Upload Zone - Only show if no result */}
              {!uploadResult && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  {isUploading ? (
                    <div>
                      <div className="mx-auto h-12 w-12 text-accent">
                        <svg
                          className="animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Uploading and validating...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <svg
                          className="h-8 w-8 text-primary"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer rounded-md font-semibold text-accent hover:text-accent-light transition-colors"
                        >
                          <span>Click to upload</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <span className="text-muted-foreground">
                          {" "}
                          or drag and drop
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Excel files only (.xlsx, .xls) - Max 10 MB - Up to 500
                        rows
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Upload Preview */}
              {uploadResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div
                    className={`rounded-xl p-4 ${
                      uploadResult.validRows === uploadResult.totalRows
                        ? "bg-success/10 border border-success/20"
                        : "bg-warning/10 border border-warning/20"
                    }`}
                  >
                    <div className="flex items-center">
                      <svg
                        className={`h-5 w-5 mr-2 ${
                          uploadResult.validRows === uploadResult.totalRows
                            ? "text-success"
                            : "text-warning"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span
                        className={`text-sm font-semibold ${
                          uploadResult.validRows === uploadResult.totalRows
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        File uploaded: {uploadResult.filename}
                      </span>
                    </div>
                    <div
                      className={`mt-2 text-sm font-medium ${
                        uploadResult.validRows === uploadResult.totalRows
                          ? "text-success"
                          : "text-warning"
                      }`}
                    >
                      Validation Summary: {uploadResult.validRows} valid,{" "}
                      {uploadResult.totalRows - uploadResult.validRows} invalid
                    </div>
                  </div>

                  {/* Invalid Rows Section */}
                  {uploadResult.validationErrors.filter(
                    (e) => e.type === "error",
                  ).length > 0 && (
                    <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-destructive mb-3">
                        Invalid Rows (
                        {
                          uploadResult.validationErrors.filter(
                            (e) => e.type === "error",
                          ).length
                        }
                        )
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {uploadResult.validationErrors
                          .filter((e) => e.type === "error")
                          .map((error, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-destructive/20 rounded-lg p-2"
                            >
                              <div className="flex items-start">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-destructive/10 text-destructive mr-2">
                                  Row {error.row}
                                </span>
                                <span className="text-xs text-destructive">
                                  {error.message}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                      {uploadResult.hasMoreErrors && (
                        <p className="text-xs text-destructive/80 mt-2 italic">
                          + more invalid rows...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warnings Section */}
                  {uploadResult.validationErrors.filter(
                    (e) => e.type === "warning",
                  ).length > 0 && (
                    <div className="border border-warning/20 bg-warning/5 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-warning mb-2">
                        Warnings
                      </h3>
                      <ul className="text-xs text-warning space-y-1 max-h-32 overflow-y-auto">
                        {uploadResult.validationErrors
                          .filter((e) => e.type === "warning")
                          .map((error, idx) => (
                            <li key={idx}>
                              Row {error.row}: {error.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      Preview (First 10 rows)
                    </h3>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-primary/5">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-primary uppercase">
                                Company
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-primary uppercase">
                                Contact
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-primary uppercase">
                                Title
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-primary uppercase">
                                LinkedIn
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {uploadResult.opportunities.map((opp, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-3 py-2 text-sm text-foreground">
                                  {opp.companyName}
                                </td>
                                <td className="px-3 py-2 text-sm text-foreground">
                                  {opp.firstName} {opp.lastName}
                                </td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">
                                  {opp.jobTitle}
                                </td>
                                <td className="px-3 py-2 text-sm text-accent truncate max-w-xs">
                                  {opp.linkedinLink ? (
                                    <a
                                      href={opp.linkedinLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline font-medium cursor-pointer"
                                    >
                                      Link
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {uploadResult.totalRows > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing 10 of {uploadResult.totalRows} rows
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setUploadResult(null);
                        setUploadError(null);
                      }}
                      className="px-4 py-2.5 text-sm font-medium text-muted-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    {uploadResult.validRows > 0 &&
                      uploadResult.validRows < uploadResult.totalRows && (
                        <button
                          onClick={handleConfirmAndProcess}
                          disabled={isCreatingJob}
                          className="px-6 py-2.5 bg-warning text-white text-sm rounded-lg hover:bg-warning/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {isCreatingJob
                            ? "Processing..."
                            : "Process Valid Rows Only"}
                        </button>
                      )}
                    {uploadResult.validRows === uploadResult.totalRows && (
                      <button
                        onClick={handleConfirmAndProcess}
                        disabled={isCreatingJob}
                        className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isCreatingJob
                          ? "Creating Job..."
                          : "Confirm and Process"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Recent Jobs */}
          <div className="lg:col-span-1">
            <div
              className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-4">
                Recent Jobs
              </h2>
              {isLoadingJobs ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 text-accent">
                    <svg
                      className="animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">No jobs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50/50 hover:border-gray-200 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() =>
                            router.push(`/example/leadgen/jobs/${job.id}`)
                          }
                        >
                          <p className="text-sm font-semibold text-foreground truncate">
                            {job.filename}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {job.totalRecords}{" "}
                            {job.totalRecords === 1 ? "record" : "records"}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {new Date(job.createdAt).toLocaleDateString()}{" "}
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              job.status === "completed"
                                ? "bg-success/10 text-success"
                                : job.status === "processing"
                                  ? "bg-accent/10 text-accent"
                                  : job.status === "failed"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-gray-100 text-muted-foreground"
                            }`}
                          >
                            {job.status}
                          </span>
                          {job.status !== "processing" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setJobToDelete(job);
                                setShowDeleteDialog(true);
                              }}
                              disabled={deletingJobId === job.id}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && jobToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Delete Job?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to delete{" "}
                <strong>{jobToDelete.filename}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone and all associated data will be
                permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setJobToDelete(null);
                  }}
                  disabled={deletingJobId !== null}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deletingJobId !== null}
                  className="px-5 py-2.5 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {deletingJobId !== null ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
