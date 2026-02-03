import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/workshop.db";

// Create database connection
const sqlite = new Database(DATABASE_PATH);

// Enable foreign keys
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = 10000");

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for type safety
export * from "./schema";
