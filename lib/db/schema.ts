import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Cases table
export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  industry: text("industry"),
  technologies: text("technologies"), // JSON array stored as text
  description: text("description"),
  outcomes: text("outcomes"),
  link: text("link"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Recommendations table
export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("general"), // 'general' | 'message1' | 'message2' | 'message3'
  content: text("content").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  priority: integer("priority").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// System settings table
export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // 'prompts' | 'general' | 'agent'
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Jobs table
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename"),
  filePath: text("file_path"),
  status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled'
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  errorMessage: text("error_message"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Processing records table
export const processingRecords = sqliteTable("processing_records", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed'

  // Source data from Excel
  companyName: text("company_name").notNull(),
  linkedinLink: text("linkedin_link"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  jobTitle: text("job_title"),
  rawData: text("raw_data"), // JSON: all columns from Excel including extras

  // Research results
  researchData: text("research_data"), // JSON: web search results, matched cases
  companyRegion: text("company_region"),
  companyIndustry: text("company_industry"),
  companyNews: text("company_news"), // JSON array: recent news items

  // Generated LinkedIn messages
  message1: text("message1"),
  message2: text("message2"),
  message3: text("message3"),

  // Metadata
  matchedCaseIds: text("matched_case_ids"), // JSON array of case UUIDs
  selectedNewsIndices: text("selected_news_indices"), // JSON array of indices used in generation
  selectedCaseIndices: text("selected_case_indices"), // JSON array of indices used in generation
  appliedRegionalTone: text("applied_regional_tone"), // Regional tone key applied (e.g., "regional_tone_usa")
  processingTimeMs: integer("processing_time_ms"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
