/**
 * Standalone cron scheduler for processing jobs
 * Run this with: node scripts/cron-scheduler.js
 */

require("dotenv").config();
const cron = require("node-cron");

const CRON_SECRET = process.env.CRON_SECRET || "internal-cron-secret";
const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("=".repeat(60));
console.log("AI Workshop - Cron Scheduler");
console.log("=".repeat(60));
console.log("Starting cron scheduler...");
console.log(`API URL: ${API_URL}`);
console.log(`Schedule: Every 20 seconds (*/20 * * * * *)`);
console.log("=".repeat(60));

// Run every 20 seconds
cron.schedule("*/20 * * * * *", async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Running job processing...`);

  try {
    const response = await fetch(`${API_URL}/api/example/cron/process`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": CRON_SECRET,
      },
    });

    if (!response.ok) {
      console.error(`[ERROR] Processing failed with status ${response.status}`);
      const text = await response.text();
      console.error(`Response: ${text.substring(0, 200)}`);
      return;
    }

    const result = await response.json();

    if (result.recordsProcessed > 0) {
      console.log(
        `[SUCCESS] Processed ${result.recordsProcessed} records from ${result.jobsProcessed} jobs`,
      );
    } else {
      console.log(`[INFO] No pending records to process`);
    }
  } catch (error) {
    console.error("[ERROR] Failed to process jobs:", error.message);
  }
});

console.log("\nCron scheduler started successfully!");
console.log("Press Ctrl+C to stop.\n");

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n\nShutting down cron scheduler...");
  process.exit(0);
});
