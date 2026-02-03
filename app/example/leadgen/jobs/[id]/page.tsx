"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, Home } from "lucide-react";

interface Job {
  id: string;
  filename: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobStats {
  avgProcessingTimeMs: number;
  estimatedTimeRemainingMs: number;
  recordsPerMinute: number;
  queuePosition: number;
  // Full status breakdown
  pendingRecords: number;
  processingRecords: number;
  completedRecords: number;
  failedRecords: number;
}

export default function JobStatusPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Handle job cancellation
  const handleCancelJob = async () => {
    setCancelling(true);
    try {
      const response = await fetch(
        `/api/example/leadgen/jobs/${jobId}/cancel`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to cancel job");
      }

      // Refresh job data to show cancelled status
      const jobResponse = await fetch(`/api/example/leadgen/jobs/${jobId}`);
      if (jobResponse.ok) {
        const data = await jobResponse.json();
        setJob(data.job);
        setStats(data.stats);
      }

      setShowCancelDialog(false);
    } catch (err) {
      console.error("Error cancelling job:", err);
      alert("Failed to cancel job. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/example/leadgen/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete job");
      }

      // Redirect to LeadGen page after successful deletion
      router.push("/example/leadgen");
    } catch (err) {
      console.error("Error deleting job:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete job. Please try again.",
      );
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Send notification when job completes
  useEffect(() => {
    if (!job) return;

    // Check if status changed from processing/pending to completed
    if (
      previousStatus &&
      previousStatus !== "completed" &&
      job.status === "completed"
    ) {
      // Send browser notification
      if (notificationPermission === "granted" && "Notification" in window) {
        const notification = new Notification("Job Completed!", {
          body: `Your job "${job.filename}" has finished processing. ${job.processedRecords} records completed.`,
          icon: "/favicon.ico",
          tag: jobId,
          requireInteraction: false,
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          router.push(`/example/leadgen/jobs/${jobId}/results`);
          notification.close();
        };
      }
    }

    // Update previous status
    setPreviousStatus(job.status);
  }, [job?.status, notificationPermission, jobId, router, previousStatus, job]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/example/leadgen/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job");
        }
        const data = await response.json();
        setJob(data.job);
        setStats(data.stats);
        setLastUpdated(new Date());
      } catch (err) {
        setError("Failed to load job status");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchJob();

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchJob();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-accent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-medium">
            Loading job status...
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-destructive font-medium mb-4">
            {error || "Job not found"}
          </p>
          <button
            onClick={() => router.push("/example/leadgen")}
            className="btn-accent cursor-pointer"
          >
            Back to LeadGen
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress percentages for segmented progress bar
  const completedProgress =
    job.totalRecords > 0 && stats
      ? Math.round(
          ((stats.completedRecords + stats.failedRecords) / job.totalRecords) *
            100,
        )
      : 0;
  const processingProgress =
    job.totalRecords > 0 && stats
      ? Math.round((stats.processingRecords / job.totalRecords) * 100)
      : 0;
  const totalProgress = completedProgress + processingProgress;

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms === 0) return "Calculating...";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `~${minutes}m ${seconds % 60}s`;
    } else {
      return `~${seconds}s`;
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
                  Job Status
                </h1>
                <p className="text-sm text-muted-foreground">
                  {job.filename} <span className="mx-2">-</span>{" "}
                  {new Date(job.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/example")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => router.push("/example/leadgen")}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              >
                Back to LeadGen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 space-y-6 animate-fade-in">
          {/* Status Badge with Queue Position */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Status
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  job.status === "completed" ||
                  job.status === "completed_with_errors"
                    ? "bg-success/10 text-success"
                    : job.status === "processing"
                      ? "bg-accent/10 text-accent"
                      : job.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                }`}
              >
                {job.status.charAt(0).toUpperCase() +
                  job.status.slice(1).replace("_", " ")}
              </span>
              {job.status === "pending" && stats && stats.queuePosition > 0 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-muted-foreground">
                  Queue Position: #{stats.queuePosition}
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Progress
              </h2>
              <span className="text-sm font-medium text-foreground">
                {stats
                  ? stats.completedRecords + stats.failedRecords
                  : job.processedRecords}{" "}
                of {job.totalRecords} records
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative">
              {/* Completed + Failed progress (solid) */}
              <div
                className="h-3 absolute left-0 top-0 transition-all duration-500 ease-out"
                style={{
                  width: `${completedProgress}%`,
                  background:
                    "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
                }}
              />
              {/* Processing progress (animated pulse) */}
              {processingProgress > 0 && (
                <div
                  className="h-3 absolute top-0 transition-all duration-500 ease-out animate-pulse"
                  style={{
                    left: `${completedProgress}%`,
                    width: `${processingProgress}%`,
                    background: "hsl(var(--accent) / 0.5)",
                  }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedProgress}% complete
              {processingProgress > 0
                ? `, ${processingProgress}% processing`
                : ""}
            </p>
          </div>

          {/* Processing Stats - Only show when processing */}
          {job.status === "processing" && stats && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Estimated Time Remaining
                </h3>
                <p className="mt-1 text-2xl font-bold text-accent">
                  {formatTimeRemaining(stats.estimatedTimeRemainingMs)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Processing Speed
                </h3>
                <p className="mt-1 text-2xl font-bold text-accent">
                  {stats.recordsPerMinute > 0
                    ? `${stats.recordsPerMinute} records/min`
                    : "Calculating..."}
                </p>
              </div>
            </div>
          )}

          {/* Record Statistics */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Record Statistics
            </h2>
            <div className="grid grid-cols-5 gap-3">
              <div className="p-3 bg-gray-50/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-foreground">
                  {job.totalRecords}
                </p>
                <h3 className="text-xs font-medium text-muted-foreground mt-1">
                  Total
                </h3>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-warning">
                  {stats?.pendingRecords ?? 0}
                </p>
                <h3 className="text-xs font-medium text-muted-foreground mt-1">
                  Queued
                </h3>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-accent">
                  {stats?.processingRecords ?? 0}
                </p>
                <h3 className="text-xs font-medium text-muted-foreground mt-1">
                  Processing
                </h3>
              </div>
              <div className="p-3 bg-success/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-success">
                  {stats?.completedRecords ?? 0}
                </p>
                <h3 className="text-xs font-medium text-muted-foreground mt-1">
                  Completed
                </h3>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-destructive">
                  {stats?.failedRecords ?? 0}
                </p>
                <h3 className="text-xs font-medium text-muted-foreground mt-1">
                  Failed
                </h3>
              </div>
            </div>
          </div>

          {/* Job Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50/50 rounded-xl">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Created
              </h3>
              <p className="mt-1 text-sm font-medium text-foreground">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-xl">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Last Updated
              </h3>
              <p className="mt-1 text-sm font-medium text-foreground">
                {new Date(job.updatedAt).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Refreshed: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {job.errorMessage && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-destructive mb-1">
                Error
              </h3>
              <p className="text-sm text-destructive">{job.errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                {job.status === "completed" && (
                  <button
                    onClick={() =>
                      router.push(`/example/leadgen/jobs/${jobId}/results`)
                    }
                    className="btn-accent cursor-pointer"
                  >
                    View Results
                  </button>
                )}
                {job.status === "cancelled" && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      This job was cancelled. Partial results may be available.
                    </p>
                    {job.processedRecords > 0 && (
                      <button
                        onClick={() =>
                          router.push(`/example/leadgen/jobs/${jobId}/results`)
                        }
                        className="btn-primary cursor-pointer"
                      >
                        View Partial Results
                      </button>
                    )}
                  </div>
                )}
                {job.status === "pending" && (
                  <p className="text-sm text-muted-foreground">
                    Job is queued and will start processing shortly...
                  </p>
                )}
                {job.status === "processing" && (
                  <p className="text-sm text-muted-foreground">
                    Processing in progress. This page will update automatically.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {(job.status === "pending" || job.status === "processing") && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="px-4 py-2.5 text-sm text-destructive hover:text-white border border-destructive/30 rounded-lg hover:bg-destructive font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Cancel Job
                  </button>
                )}
                {(job.status === "cancelled" ||
                  job.status === "completed" ||
                  job.status === "completed_with_errors" ||
                  job.status === "failed") && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:text-white border border-destructive/30 rounded-lg hover:bg-destructive font-semibold transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Job
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Cancel Job?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to cancel this job? Processing will stop
                and any partial results will be preserved.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  disabled={cancelling}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Keep Processing
                </button>
                <button
                  onClick={handleCancelJob}
                  disabled={cancelling}
                  className="px-5 py-2.5 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
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
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this job? This action cannot be
                undone and all associated data will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleting}
                  className="px-5 py-2.5 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Yes, Delete Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
