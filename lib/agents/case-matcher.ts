/**
 * Case Matching Module
 * Handles fetching case data and matching relevant cases for opportunities
 */

import { db } from "@/lib/db";
import { systemSettings, cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { MAIN_MODEL } from "./config";

// Zod schema for case selection structured output
const CaseSelectionSchema = z.object({
  selectedCaseIds: z
    .array(z.string())
    .describe(
      "Array of case IDs (the ID shown in brackets) for the 1-2 most relevant cases",
    ),
});

// In-memory cache for case data
interface CaseData {
  id: string;
  country: string;
  title: string;
  industry: string;
  link: string;
}

// Matched case output with title and link
export interface MatchedCase {
  title: string;
  link: string;
}

interface CaseCache {
  data: CaseData[];
  timestamp: number;
  expiresAt: number;
}

let caseCache: CaseCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Normalize a URL to ensure it has the full base URL
 */
function normalizeUrl(url: string): string {
  if (!url) return "";
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Return as-is for relative URLs (let the caller handle base URL)
  return url;
}

/**
 * Fetch case data URL from system settings
 */
async function getCaseDataUrl(): Promise<string> {
  const setting = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "case_data_url"))
    .limit(1);

  if (setting.length === 0) {
    throw new Error("case_data_url not found in system_settings");
  }

  return setting[0].value;
}

/**
 * Fetch live case data from configured JSON endpoint
 * Implements 1-hour in-memory cache
 */
export async function fetchLiveCaseData(): Promise<CaseData[]> {
  console.log("[Case Matcher] Checking case data cache...");

  // Check cache first
  if (caseCache && Date.now() < caseCache.expiresAt) {
    console.log("[Case Matcher] Using cached case data");
    return caseCache.data;
  }

  console.log(
    "[Case Matcher] Cache expired or empty, fetching live case data...",
  );

  try {
    const url = await getCaseDataUrl();
    console.log(`[Case Matcher] Fetching from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AI-Sales-Lab/1.0",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    // Extract cases from nested structure (API format)
    const casesArray =
      rawData?.data?.allProjectPreview?.nodes ||
      (Array.isArray(rawData) ? rawData : []);
    console.log(`[Case Matcher] Received ${casesArray.length} cases`);

    // Preprocess: Extract id, country, title, industry, and link fields
    const preprocessedData: CaseData[] = casesArray.map((item: any) => ({
      id: item.id || "",
      country: item.country || item.location || item.region || "Unknown",
      title: item.title || item.name || "Untitled Case",
      industry: item.industry || item.sector || "Other",
      link: normalizeUrl(item.project_url || item.link || item.url || ""),
    }));

    console.log(`[Case Matcher] Preprocessed ${preprocessedData.length} cases`);

    // Update cache
    caseCache = {
      data: preprocessedData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };

    return preprocessedData;
  } catch (error: any) {
    console.error(
      "[Case Matcher] Failed to fetch live case data:",
      error.message,
    );
    console.log("[Case Matcher] Falling back to database cases...");
    return await fetchDatabaseCases();
  }
}

/**
 * Fallback: Fetch cases from local database
 */
export async function fetchDatabaseCases(): Promise<CaseData[]> {
  console.log("[Case Matcher] Fetching cases from database...");

  const dbCases = await db
    .select({
      id: cases.id,
      title: cases.title,
      industry: cases.industry,
      link: cases.link,
    })
    .from(cases)
    .where(eq(cases.isActive, true));

  // Map database cases to CaseData format
  const caseData: CaseData[] = dbCases.map((c) => ({
    id: c.id || "",
    country: "Unknown", // Database cases don't have country field
    title: c.title || "Untitled Case",
    industry: c.industry || "Other",
    link: normalizeUrl(c.link || ""),
  }));

  console.log(
    `[Case Matcher] Retrieved ${caseData.length} cases from database`,
  );
  return caseData;
}

/**
 * Filter cases by industry and optionally by country
 */
export function filterCases(
  allCases: CaseData[],
  targetIndustry: string,
  targetCountry?: string,
): CaseData[] {
  console.log(
    `[Case Matcher] Filtering cases for industry: ${targetIndustry}, country: ${targetCountry || "any"}`,
  );

  // First filter by industry (most important)
  let filtered = allCases.filter((c) => {
    const caseIndustry = c.industry.toLowerCase();
    const targetInd = targetIndustry.toLowerCase();

    // Exact match or partial match
    return caseIndustry.includes(targetInd) || targetInd.includes(caseIndustry);
  });

  console.log(
    `[Case Matcher] Found ${filtered.length} cases matching industry`,
  );

  // If we have too few matches, expand to related industries
  if (filtered.length < 3) {
    // Industry mapping for better matching with new classification
    const industryGroups: { [key: string]: string[] } = {
      "aerospace & defense": ["aerospace", "defense", "military", "aviation"],
      automotive: ["auto", "vehicle", "car", "motor"],
      aviation: ["airline", "aircraft", "aerospace", "flight"],
      construction: ["building", "infrastructure", "engineering"],
      enterprise: ["business", "corporate", "b2b", "saas"],
      fintech: [
        "financial technology",
        "payment",
        "banking tech",
        "financial services",
      ],
      "financial services": ["finance", "banking", "fintech", "investment"],
      healthcare: ["health", "medical", "pharma", "biotech", "hospital"],
      insurance: ["insurtech", "financial services", "risk"],
      legal: ["law", "legaltech", "compliance"],
      logistics: ["supply chain", "transportation", "shipping", "freight"],
      manufacturing: ["industrial", "production", "factory"],
      "media & entertainment": [
        "media",
        "entertainment",
        "broadcasting",
        "streaming",
      ],
      "oil & gas": ["energy", "petroleum", "utilities"],
      "real estate": ["property", "proptech", "housing"],
      retail: ["consumer", "shopping", "ecommerce"],
      telecom: ["telecommunications", "mobile", "network"],
      "travel & hospitality": ["travel", "hotel", "tourism", "hospitality"],
      ecommerce: ["retail", "online shopping", "marketplace"],
      elearning: ["education", "edtech", "learning", "training"],
      igaming: ["gaming", "gambling", "betting", "casino"],
    };

    const targetLower = targetIndustry.toLowerCase();
    let relatedTerms: string[] = [];

    for (const [key, synonyms] of Object.entries(industryGroups)) {
      if (
        targetLower.includes(key) ||
        synonyms.some((s) => targetLower.includes(s))
      ) {
        relatedTerms = [...synonyms, key];
        break;
      }
    }

    if (relatedTerms.length > 0) {
      filtered = allCases.filter((c) => {
        const caseIndustry = c.industry.toLowerCase();
        return relatedTerms.some((term) => caseIndustry.includes(term));
      });
      console.log(
        `[Case Matcher] Expanded to ${filtered.length} cases using related industries`,
      );
    }
  }

  // If still too few, return all cases (LLM will select best matches)
  if (filtered.length === 0) {
    console.log(
      "[Case Matcher] No industry matches found, returning all cases for LLM selection",
    );
    return allCases;
  }

  return filtered;
}

/**
 * Select best 1-2 cases using LLM with structured outputs
 */
export async function selectBestCases(
  filteredCases: CaseData[],
  companyName: string,
  industry: string,
  country: string,
  openai: any, // OpenAI instance
): Promise<MatchedCase[]> {
  if (filteredCases.length === 0) {
    console.log("[Case Matcher] No cases to select from");
    return [];
  }

  console.log(
    `[Case Matcher] Selecting best cases from ${filteredCases.length} candidates...`,
  );

  // If only 1-2 cases available, return them
  if (filteredCases.length <= 2) {
    const matchedCases = filteredCases.map((c) => ({
      title: c.title,
      link: c.link,
    }));
    console.log(
      `[Case Matcher] Returning ${matchedCases.length} available cases:`,
      matchedCases.map((c) => c.title),
    );
    return matchedCases;
  }

  // Use LLM to select best 1-2 cases
  const casesContext = filteredCases
    .map(
      (c, i) =>
        `${i + 1}. [ID: ${c.id}] ${c.title} (${c.industry}, ${c.country})`,
    )
    .join("\n");

  const selectionPrompt = `You are helping select the most relevant case studies for a sales opportunity.

Target Company: ${companyName}
Industry: ${industry}
Country: ${country}

Available Cases:
${casesContext}

Select the 1-2 most relevant cases based on:
1. Industry relevance (HIGHEST PRIORITY)
2. Problem alignment
3. Geographic relevance (LOWER PRIORITY)
4. Technology fit

IMPORTANT: Return the CASE IDs (the values shown in [ID: xxx] brackets), not the titles or numbers.
Maximum 2 cases. If only 1 is highly relevant, return just that one.`;

  try {
    // Use structured outputs with Zod schema for type-safe responses
    const response = await openai.chat.completions.create({
      model: MAIN_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a case study selection expert. Select the most relevant case studies for the given sales opportunity.",
        },
        {
          role: "user",
          content: selectionPrompt,
        },
      ],
      response_format: zodResponseFormat(CaseSelectionSchema, "case_selection"),
      max_completion_tokens: 4000,
    });

    const parsed: z.infer<typeof CaseSelectionSchema> | null = response
      .choices[0]?.message?.content
      ? JSON.parse(response.choices[0].message.content)
      : null;

    if (!parsed) {
      console.log("[Case Matcher] Failed to parse response, using top 2 cases");
      return filteredCases
        .slice(0, 2)
        .map((c) => ({ title: c.title, link: c.link }));
    }

    const selectedIds = parsed.selectedCaseIds.slice(0, 2); // Ensure max 2
    console.log(`[Case Matcher] LLM selected case IDs:`, selectedIds);

    // Map IDs back to MatchedCase objects
    const selectedCases: MatchedCase[] = [];
    for (const id of selectedIds) {
      const caseData = filteredCases.find((c) => c.id === id);
      if (caseData) {
        selectedCases.push({ title: caseData.title, link: caseData.link });
      }
    }
    return selectedCases;
  } catch (error: any) {
    console.error("[Case Matcher] LLM selection failed:", error.message);
    console.log("[Case Matcher] Falling back to top 2 cases by default");
    return filteredCases
      .slice(0, 2)
      .map((c) => ({ title: c.title, link: c.link }));
  }
}

/**
 * Main function: Match cases for an opportunity
 */
export async function matchCasesForOpportunity(
  companyName: string,
  industry: string,
  country: string,
  openai: any,
): Promise<MatchedCase[]> {
  try {
    console.log(`[Case Matcher] Starting case matching for ${companyName}...`);

    // Step 1: Fetch live case data (with cache and fallback)
    const allCases = await fetchLiveCaseData();

    // Step 2: Filter by industry and country
    const filteredCases = filterCases(allCases, industry, country);

    // Step 3: LLM selection of best 1-2 cases
    const selectedCases = await selectBestCases(
      filteredCases,
      companyName,
      industry,
      country,
      openai,
    );

    console.log(
      `[Case Matcher] Case matching complete. Selected ${selectedCases.length} cases.`,
    );
    return selectedCases;
  } catch (error: any) {
    console.error("[Case Matcher] Case matching failed:", error.message);
    return [];
  }
}
