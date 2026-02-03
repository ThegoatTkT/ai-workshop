import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  createdAt: string | null;
  updatedAt: string | null;
}

// In-memory cache with TTL
interface CacheEntry {
  data: SystemSetting[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let settingsCache: CacheEntry | null = null;

/**
 * Invalidate the settings cache
 * Call this after updating settings via API
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
}

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  if (!settingsCache) return false;
  return Date.now() - settingsCache.timestamp < CACHE_TTL_MS;
}

/**
 * Get all settings from database (with caching)
 */
export async function getAllSettings(): Promise<SystemSetting[]> {
  if (isCacheValid() && settingsCache) {
    return settingsCache.data;
  }

  try {
    const settings = await db.select().from(systemSettings);
    settingsCache = {
      data: settings,
      timestamp: Date.now(),
    };
    return settings;
  } catch (error) {
    console.error("[Settings] Failed to fetch settings from database:", error);
    // Return cached data if available, even if expired
    if (settingsCache) {
      return settingsCache.data;
    }
    return [];
  }
}

/**
 * Get settings filtered by category
 */
export async function getSettingsByCategory(
  category: string,
): Promise<SystemSetting[]> {
  const all = await getAllSettings();
  return all.filter((s) => s.category === category);
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const all = await getAllSettings();
  const setting = all.find((s) => s.key === key);
  return setting?.value ?? null;
}

/**
 * Get a setting with a fallback default value
 */
export async function getSettingOrDefault(
  key: string,
  defaultValue: string,
): Promise<string> {
  const value = await getSetting(key);
  return value ?? defaultValue;
}

/**
 * Get multiple settings as a key-value map
 */
export async function getSettingsMap(
  keys: string[],
): Promise<Record<string, string>> {
  const all = await getAllSettings();
  const result: Record<string, string> = {};

  for (const key of keys) {
    const setting = all.find((s) => s.key === key);
    if (setting) {
      result[key] = setting.value;
    }
  }

  return result;
}

/**
 * Update a setting value in the database
 * Also invalidates the cache
 */
export async function updateSetting(
  key: string,
  value: string,
): Promise<boolean> {
  try {
    const result = await db
      .update(systemSettings)
      .set({
        value,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(systemSettings.key, key));

    invalidateSettingsCache();
    return true;
  } catch (error) {
    console.error(`[Settings] Failed to update setting ${key}:`, error);
    return false;
  }
}

// Default prompts as fallbacks (in case database is unavailable)
export const DEFAULT_PROMPTS: Record<string, string> = {
  research_prompt: `You are a sales research assistant. Research the company to gather context for personalized LinkedIn outreach.

Research the following:
1. Recent company news (within last 12 months)
2. Company industry and region
3. Company size and growth signals
4. Relevant business challenges or initiatives

Return structured data including company region, industry, news items with dates.`,

  classification_prompt: `Based on the research, extract:
1. The company's primary country
2. The company's primary industry
3. Recent news items (less than 1 year old)

Only include news items with actual dates.`,

  news_search_prompt: `Search for recent news about the company.

Focus on finding:
1. Press releases and official announcements
2. Product launches, partnerships, or expansions
3. Financial news (funding rounds, earnings, acquisitions)
4. Leadership changes or strategic initiatives
5. Industry recognition or awards

Only include news from the last 12 months.`,

  message1_prompt: `Generate LinkedIn Message 1 (Proposal - Brief Introduction).

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Body: EXACTLY 100-150 words
- Use recipient's actual first name in greeting (no placeholders like [Name])
- Introduce yourself and establish initial value proposition
- Reference recent company news if available
- Professional but conversational LinkedIn tone
- End with soft call-to-action (NO signature placeholders)`,

  message2_prompt: `Generate LinkedIn Message 2 (Invitation - Detailed Service Description).

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Body: EXACTLY 150-250 words (this must be LONGER than Message 1)
- Use recipient's actual first name in greeting (no placeholders)
- Provide detailed description of 2-3 specific services/capabilities
- Mention 1-2 relevant case studies by name with specific outcomes. USE THE EXACT URLs provided
- Reference news talking points if available
- Include a soft call-to-action appropriate for LinkedIn
- Professional but conversational LinkedIn tone`,

  message3_prompt: `Generate LinkedIn Message 3 (Case Study - Detailed Presentation).

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Body: EXACTLY 150-250 words
- Use recipient's first name in greeting
- Present a specific matched case study using THE EXACT URL provided
- You MUST use the exact URL provided, do NOT construct or guess URLs
- Draw clear connection to prospect's needs
- Include specific, measurable outcomes from the case
- Professional but conversational LinkedIn tone
- End with soft call-to-action (NO signature placeholders)`,

  message_system_prompt: `You are an expert LinkedIn outreach specialist for a global software development company. Write professional, personalized LinkedIn messages that demonstrate expertise and build relationships. LinkedIn messages should be conversational yet professional. Never use placeholder text like [Your Name] or [Your Position]. Word count requirements are mandatory. Remember: LinkedIn messages have NO subject lines.`,

  case_selection_prompt: `Select 1-2 most relevant case studies for this sales opportunity.

Selection criteria (in order of priority):
1. Industry relevance (highest priority)
2. Problem/solution alignment
3. Geographic relevance
4. Technology fit

Return array of selected case titles (maximum 2).`,
};
