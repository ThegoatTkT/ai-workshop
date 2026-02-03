import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { matchCasesForOpportunity, MatchedCase } from "./case-matcher";
import { getSettingsMap, DEFAULT_PROMPTS } from "@/lib/settings";
import { MAIN_MODEL, WEB_SEARCH_MODEL } from "./config";
import { getRegionalToneKey, getRegionDisplayName } from "./region-mapper";

// Lazy-initialized OpenAI client to avoid build-time errors
let _openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// Country classification options
const COUNTRIES = [
  "Australia",
  "Austria",
  "Belgium",
  "Canada",
  "Cyprus",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Hungary",
  "Ireland",
  "Italy",
  "Kazakhstan",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Qatar",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Sweden",
  "Switzerland",
  "UAE",
  "UK",
  "USA",
  "Unknown",
] as const;

// Industry classification options
const INDUSTRIES = [
  "Aerospace & Defense",
  "Automotive",
  "Aviation",
  "Construction",
  "Enterprise",
  "FinTech",
  "Financial Services",
  "Healthcare",
  "Insurance",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Media & Entertainment",
  "Oil & Gas",
  "Real Estate",
  "Retail",
  "Telecom",
  "Travel & Hospitality",
  "eCommerce",
  "eLearning",
  "iGaming",
  "Other",
] as const;

// Zod schema for structured outputs - company classification
const CompanyClassificationSchema = z.object({
  country: z
    .enum(COUNTRIES)
    .describe("The company's primary country of operation"),
  industry: z.enum(INDUSTRIES).describe("The company's primary industry"),
  news: z
    .array(
      z.object({
        title: z.string().describe("News article title"),
        date: z
          .string()
          .describe("Publication date in ISO format or readable date"),
        source: z.string().describe("Source URL or publication name"),
        summary: z.string().describe("Brief summary of the news item"),
      }),
    )
    .describe("Recent news items from the last year"),
});

type CompanyClassification = z.infer<typeof CompanyClassificationSchema>;

// Zod schema for dedicated news search results
const CompanyNewsSearchSchema = z.object({
  news: z
    .array(
      z.object({
        title: z.string().describe("News article title"),
        date: z
          .string()
          .describe("Publication date in ISO format or readable date"),
        source: z.string().describe("Source URL or publication name"),
        summary: z
          .string()
          .describe("Brief summary of the news item (2-3 sentences)"),
      }),
    )
    .describe(
      "Recent news items from the last year, sorted by date (newest first)",
    ),
});

type CompanyNewsSearch = z.infer<typeof CompanyNewsSearchSchema>;

// Map country names to ISO 3166-1 alpha-2 codes for web search location
const COUNTRY_TO_ISO: Record<string, string> = {
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Canada: "CA",
  Cyprus: "CY",
  Denmark: "DK",
  Estonia: "EE",
  Finland: "FI",
  France: "FR",
  Georgia: "GE",
  Germany: "DE",
  Hungary: "HU",
  Ireland: "IE",
  Italy: "IT",
  Kazakhstan: "KZ",
  Latvia: "LV",
  Lithuania: "LT",
  Luxembourg: "LU",
  Malta: "MT",
  Netherlands: "NL",
  Poland: "PL",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Serbia: "RS",
  Singapore: "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  Sweden: "SE",
  Switzerland: "CH",
  UAE: "AE",
  UK: "GB",
  USA: "US",
};

/**
 * Perform dedicated web search for company news with location-aware context
 * Uses OpenAI's web search capabilities with high context and location settings
 */
async function searchCompanyNews(
  companyName: string,
  country: string,
  industry: string,
): Promise<CompanyNewsSearch["news"]> {
  console.log(
    `[LLM Agent] Performing dedicated news search for ${companyName} in ${country}...`,
  );

  // Convert country name to ISO code for web search
  const countryIsoCode = COUNTRY_TO_ISO[country] || "US";
  console.log(`[LLM Agent] Using country ISO code: ${countryIsoCode}`);

  const newsSearchPrompt = `Search for recent news about "${companyName}" company.

Company Details:
- Company Name: ${companyName}
- Country: ${country}
- Industry: ${industry}

Focus on finding:
1. Press releases and official announcements (last 12 months)
2. Product launches, partnerships, or expansions
3. Financial news (funding rounds, earnings, acquisitions)
4. Leadership changes or strategic initiatives
5. Industry recognition or awards

IMPORTANT: 
- Only include news from the last 12 months
- Include the actual publication date for each item
- Include the source URL when available
- Prioritize news from reputable business sources
- Focus on news relevant to the ${industry} industry`;

  try {
    // Use OpenAI chat completions API with web search
    // See: https://platform.openai.com/docs/guides/tools-web-search?api-mode=chat
    // Include country context in the prompt since user_location may not be supported
    const localizedPrompt = `${newsSearchPrompt}\n\nNote: Focus on news sources and business publications from ${country} (ISO: ${countryIsoCode}) when available.`;

    const newsResponse = await getOpenAIClient().chat.completions.create({
      model: WEB_SEARCH_MODEL,
      web_search_options: {},
      messages: [
        {
          role: "user",
          content: localizedPrompt,
        },
      ],
    } as any); // Type assertion needed as web_search_options types may not be in SDK yet

    // Extract the text content from the response
    const responseText = newsResponse.choices[0]?.message?.content || "";
    console.log(
      `[LLM Agent] Web search completed for ${companyName}, extracting structured news...`,
    );

    // Parse the web search results into structured format
    const structuredResponse = await getOpenAIClient().chat.completions.create({
      model: MAIN_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a news analyst. Extract structured news items from the provided web search results. Only include items with clear dates within the last 12 months. If a date is unclear, estimate based on context but mark it as approximate.",
        },
        {
          role: "user",
          content: `Extract news items from these web search results about ${companyName}:\n\n${responseText}\n\nReturn up to 10 most relevant news items, sorted by date (newest first).`,
        },
      ],
      response_format: zodResponseFormat(
        CompanyNewsSearchSchema,
        "company_news",
      ),
    });

    const parsedNews: CompanyNewsSearch = JSON.parse(
      structuredResponse.choices[0]?.message?.content || "{}",
    );

    if (!parsedNews || !parsedNews.news) {
      console.log(
        `[LLM Agent] No structured news extracted for ${companyName}`,
      );
      return [];
    }

    console.log(
      `[LLM Agent] Found ${parsedNews.news.length} news items for ${companyName}`,
    );
    return parsedNews.news;
  } catch (error: any) {
    console.error(
      `[LLM Agent] News search error for ${companyName}:`,
      error?.message || error,
    );
    // Return empty array on error - we'll fall back to classification news
    return [];
  }
}

// Zod schema for structured outputs - LinkedIn message generation
const MessageSchema = z.object({
  content: z
    .string()
    .describe("Complete LinkedIn message text (no subject line)"),
});

const MessagesOutputSchema = z.object({
  message1: MessageSchema.describe(
    "Proposal message - brief introduction (100-150 words)",
  ),
  message2: MessageSchema.describe(
    "Invitation message - detailed service description (150-250 words)",
  ),
  message3: MessageSchema.describe(
    "Case study message - specific case presentation (150-250 words)",
  ),
});

type MessagesOutput = z.infer<typeof MessagesOutputSchema>;

// Single message output schema for separate generation
const SingleMessageOutputSchema = z.object({
  content: z.string().describe("Complete LinkedIn message text"),
});

type SingleMessageOutput = z.infer<typeof SingleMessageOutputSchema>;

/**
 * Interpolate template variables in a prompt string
 * Replaces {{variableName}} with the corresponding value
 */
export function interpolatePrompt(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Generate a single LinkedIn message using a specific prompt template
 */
export async function generateSingleMessage(
  promptTemplate: string,
  systemPrompt: string,
  variables: Record<string, string>,
): Promise<{ content: string }> {
  const prompt = interpolatePrompt(promptTemplate, variables);

  const response = await getOpenAIClient().chat.completions.create({
    model: MAIN_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: zodResponseFormat(SingleMessageOutputSchema, "message"),
    max_completion_tokens: 8000,
  });

  const message: SingleMessageOutput = JSON.parse(
    response.choices[0]?.message?.content || "{}",
  );
  if (!message) {
    throw new Error("Failed to parse message response");
  }

  return { content: message.content };
}

/**
 * Real LLM processing function using OpenAI Responses API
 * Performs web research, extracts structured data, and generates LinkedIn messages
 * @exported for testing purposes
 */
export async function processRecordWithLLM(record: any): Promise<{
  message1: string;
  message2: string;
  message3: string;
  companyRegion: string;
  companyIndustry: string;
  companyNews: string;
  researchData: string;
  matchedCaseIds: string;
  selectedNewsIndices: string;
  selectedCaseIndices: string;
  appliedRegionalTone: string;
}> {
  const { firstName, lastName, companyName, linkedinLink } = record;

  console.log(`[LLM Agent] Starting research for ${companyName}...`);

  // Load prompts from settings (cached)
  const promptKeys = [
    "research_prompt",
    "research_system_prompt",
    "classification_prompt",
    "classification_system_prompt",
    "message1_prompt",
    "message2_prompt",
    "message3_prompt",
    "message_system_prompt",
  ];
  const prompts = await getSettingsMap(promptKeys);

  // Use database prompts with fallback to defaults
  const getPrompt = (key: string) => prompts[key] || DEFAULT_PROMPTS[key] || "";

  // Step 1: Web Research using Responses API
  const researchPromptTemplate = getPrompt("research_prompt");
  const researchSystemPrompt = getPrompt("research_system_prompt");
  const researchPrompt = interpolatePrompt(researchPromptTemplate, {
    companyName,
    linkedinLink: linkedinLink || "",
  });

  try {
    // Use web search to get real company information
    const researchResponse = await getOpenAIClient().chat.completions.create({
      model: WEB_SEARCH_MODEL,
      web_search_options: {},
      messages: [
        {
          role: "system",
          content: researchSystemPrompt,
        },
        {
          role: "user",
          content: researchPrompt,
        },
      ],
    } as any);

    const researchContent = researchResponse.choices[0]?.message?.content || "";
    console.log(`[LLM Agent] Research completed for ${companyName}`);

    // Step 2: Extract structured data using structured outputs
    console.log(`[LLM Agent] Extracting structured data for ${companyName}...`);

    const classificationPromptTemplate = getPrompt("classification_prompt");
    const classificationSystemPrompt = getPrompt(
      "classification_system_prompt",
    );
    const classificationPrompt = interpolatePrompt(
      classificationPromptTemplate,
      {
        companyName,
        COUNTRIES: COUNTRIES.slice(0, -1).join(", "),
        INDUSTRIES: INDUSTRIES.slice(0, -1).join(", "),
        researchContent,
      },
    );

    const classificationResponse =
      await getOpenAIClient().chat.completions.create({
        model: MAIN_MODEL,
        messages: [
          {
            role: "system",
            content: classificationSystemPrompt,
          },
          {
            role: "user",
            content: classificationPrompt,
          },
        ],
        response_format: zodResponseFormat(
          CompanyClassificationSchema,
          "company_classification",
        ),
      });

    const classification: CompanyClassification = JSON.parse(
      classificationResponse.choices[0]?.message?.content || "{}",
    );

    if (!classification) {
      throw new Error("Failed to parse company classification response");
    }
    console.log(
      `[LLM Agent] Extracted: Country=${classification.country}, Industry=${classification.industry}, News items=${classification.news.length}`,
    );

    // Step 2.0.5: Fetch regional tone rules for this country
    const regionalToneKey = getRegionalToneKey(classification.country);
    const regionalToneSettings = await getSettingsMap([regionalToneKey]);
    const regionalToneRules = regionalToneSettings[regionalToneKey] || "";

    if (regionalToneRules) {
      const regionName = getRegionDisplayName(classification.country);
      console.log(
        `[LLM Agent] Using regional tone rules for ${classification.country} (${regionName} region)`,
      );
    } else {
      console.log(
        `[LLM Agent] No regional tone rules found for ${classification.country}, using default style`,
      );
    }

    // Step 2.1: Dedicated news search when country and industry are known
    let enrichedNews = classification.news;
    let webSearchPerformed = false;

    if (
      classification.country !== "Unknown" &&
      classification.industry !== "Other"
    ) {
      console.log(
        `[LLM Agent] Country and industry identified - performing dedicated news search...`,
      );

      const webSearchNews = await searchCompanyNews(
        companyName,
        classification.country,
        classification.industry,
      );

      if (webSearchNews.length > 0) {
        webSearchPerformed = true;
        // Merge news: deduplicate by title similarity and prioritize web search results
        const existingTitles = new Set<string>(
          enrichedNews.map((n: { title: string }) =>
            n.title.toLowerCase().trim(),
          ),
        );
        const newNews = webSearchNews.filter((n) => {
          const titleLower = n.title.toLowerCase().trim();
          // Check for exact match or high similarity
          return (
            !existingTitles.has(titleLower) &&
            !Array.from(existingTitles).some(
              (existing: string) =>
                existing.includes(titleLower) || titleLower.includes(existing),
            )
          );
        });

        // Combine and limit to top 10 most recent
        enrichedNews = [...webSearchNews, ...enrichedNews].slice(0, 10);

        console.log(
          `[LLM Agent] Enriched news: ${enrichedNews.length} total items (${webSearchNews.length} from web search)`,
        );
      }
    } else {
      console.log(
        `[LLM Agent] Skipping dedicated news search - country: ${classification.country}, industry: ${classification.industry}`,
      );
    }

    // Store research data
    const researchData = JSON.stringify({
      researchSummary: researchContent.substring(0, 10000), // Truncate for storage
      searchesPerformed: webSearchPerformed
        ? "Web search via OpenAI (with dedicated news search)"
        : "Web search via OpenAI",
      webSearchNewsCount: webSearchPerformed ? enrichedNews.length : 0,
      timestamp: new Date().toISOString(),
    });

    const companyNews = JSON.stringify(enrichedNews);

    // Step 2.5: Match relevant cases
    const matchedCases = await matchCasesForOpportunity(
      companyName,
      classification.industry,
      classification.country,
      getOpenAIClient(),
    );
    const matchedCaseIds = JSON.stringify(matchedCases);

    // Step 3: Generate LinkedIn messages using the research
    console.log(
      `[LLM Agent] Generating LinkedIn messages for ${companyName}...`,
    );

    const matchedCasesText =
      matchedCases.length > 0
        ? `Relevant Case Studies:\n${matchedCases
            .map(
              (c: MatchedCase) =>
                `- ${c.title}${c.link ? ` (URL: ${c.link})` : ""}`,
            )
            .join("\n")}`
        : "(No specific case studies matched - use general capabilities)";

    // Prepare template variables for message prompts
    const enrichedNewsText = enrichedNews
      .map((n: any) => `- ${n.title} (${n.date}): ${n.summary || "No summary"}`)
      .join("\n");
    const messageVariables: Record<string, string> = {
      firstName,
      lastName,
      companyName,
      country: classification.country,
      industry: classification.industry,
      researchContent,
      enrichedNews: enrichedNewsText,
      matchedCasesText,
    };

    // Get message prompts from settings
    const messageSystemPromptBase = getPrompt("message_system_prompt");
    const message1PromptTemplate = getPrompt("message1_prompt");
    const message2PromptTemplate = getPrompt("message2_prompt");
    const message3PromptTemplate = getPrompt("message3_prompt");

    // Inject regional tone rules into system prompt if available
    const messageSystemPrompt = regionalToneRules
      ? `${messageSystemPromptBase}\n\nIMPORTANT - Regional Communication Guidelines for ${classification.country} (${getRegionDisplayName(classification.country)} region):\n${regionalToneRules}`
      : messageSystemPromptBase;

    // Generate LinkedIn messages in parallel using individual prompts
    console.log(
      `[LLM Agent] Generating LinkedIn Messages 1-3 for ${companyName} in parallel...`,
    );

    const [message1, message2, message3] = await Promise.all([
      generateSingleMessage(
        message1PromptTemplate,
        messageSystemPrompt,
        messageVariables,
      ),
      generateSingleMessage(
        message2PromptTemplate,
        messageSystemPrompt,
        messageVariables,
      ),
      generateSingleMessage(
        message3PromptTemplate,
        messageSystemPrompt,
        messageVariables,
      ),
    ]);

    console.log(
      `[LLM Agent] All LinkedIn messages generated for ${companyName}`,
    );

    // Validate word counts and log
    const wordCounts = {
      message1: message1.content.split(/\s+/).length,
      message2: message2.content.split(/\s+/).length,
      message3: message3.content.split(/\s+/).length,
    };
    console.log(
      `[LLM Agent] Word counts for ${companyName}: Message1=${wordCounts.message1}, Message2=${wordCounts.message2}, Message3=${wordCounts.message3}`,
    );

    // Check for placeholder patterns
    const placeholderPattern =
      /\[(Your Name|Name|Position|Title|Company|Contact)\]|\{(Name|Position|Company)\}/gi;
    const hasPlaceholders = [
      message1.content,
      message2.content,
      message3.content,
    ].some((content) => placeholderPattern.test(content));
    if (hasPlaceholders) {
      console.warn(
        `[LLM Agent] Placeholder detected in messages for ${companyName}`,
      );
    }

    console.log(
      `[LLM Agent] Successfully generated LinkedIn messages for ${companyName}`,
    );

    // Track selected indices - all news and cases are used in generation
    const selectedNewsIndices = JSON.stringify(
      enrichedNews.map((_: any, i: number) => i),
    );
    const selectedCaseIndices = JSON.stringify(
      matchedCases.map((_: any, i: number) => i),
    );

    return {
      message1: message1.content,
      message2: message2.content,
      message3: message3.content,
      companyRegion: classification.country,
      companyIndustry: classification.industry,
      companyNews,
      researchData,
      matchedCaseIds,
      selectedNewsIndices,
      selectedCaseIndices,
      appliedRegionalTone: regionalToneKey,
    };
  } catch (error: any) {
    // Check for token limit errors from structured outputs
    if (
      error?.name === "LengthFinishReasonError" ||
      error?.message?.includes("length limit")
    ) {
      console.error(
        `[LLM Agent] Token limit reached for ${companyName} - increase max_completion_tokens`,
      );
      throw new Error(
        `Message generation exceeded token limit for ${companyName}`,
      );
    }

    console.error(`[LLM Agent] Error processing ${companyName}:`, error);

    // Fallback to basic messages if API fails
    return {
      message1: `Hi ${firstName},\n\nI hope this message finds you well. I'm reaching out to explore potential partnership opportunities with ${companyName}.\n\nOur team specializes in delivering innovative software solutions that drive measurable business results.\n\nWould love to connect and share more about how we might help.`,
      message2: `Hi ${firstName},\n\nI wanted to share more about how we've helped companies similar to ${companyName} achieve their technology goals.\n\nLooking forward to connecting!`,
      message3: `Hi ${firstName},\n\nI wanted to share a relevant case study that might interest you.\n\nWould be great to discuss how similar results could apply to ${companyName}.`,
      companyRegion: "Unknown",
      companyIndustry: "Other",
      companyNews: JSON.stringify([]),
      researchData: JSON.stringify({ error: error.message }),
      matchedCaseIds: JSON.stringify([]),
      selectedNewsIndices: JSON.stringify([]),
      selectedCaseIndices: JSON.stringify([]),
      appliedRegionalTone: "regional_tone_usa",
    };
  }
}

/**
 * Process a single record
 */
export async function processRecord(recordId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Get the record
    const [record] = await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.id, recordId))
      .limit(1);

    if (!record) {
      throw new Error(`Record ${recordId} not found`);
    }

    if (record.status !== "pending") {
      console.log(
        `[Processor] Record ${recordId} has status ${record.status}, skipping`,
      );
      return;
    }

    // Update status to processing
    await db
      .update(processingRecords)
      .set({
        status: "processing",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(processingRecords.id, recordId));

    console.log(
      `[Processor] Processing record ${recordId}: ${record.companyName}`,
    );

    // Process with LLM (mock for now)
    const result = await processRecordWithLLM(record);

    const processingTimeMs = Date.now() - startTime;

    // Update record with results
    await db
      .update(processingRecords)
      .set({
        status: "completed",
        message1: result.message1,
        message2: result.message2,
        message3: result.message3,
        companyRegion: result.companyRegion,
        companyIndustry: result.companyIndustry,
        companyNews: result.companyNews,
        researchData: result.researchData,
        matchedCaseIds: result.matchedCaseIds,
        selectedNewsIndices: result.selectedNewsIndices,
        selectedCaseIndices: result.selectedCaseIndices,
        appliedRegionalTone: result.appliedRegionalTone,
        processingTimeMs,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(processingRecords.id, recordId));

    console.log(
      `[Processor] Completed record ${recordId} in ${processingTimeMs}ms`,
    );
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;

    console.error(`[Processor] Error processing record ${recordId}:`, error);

    // Update record with error
    await db
      .update(processingRecords)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error",
        processingTimeMs,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(processingRecords.id, recordId));
  }
}

/**
 * Update job status based on record statuses
 */
async function updateJobStatus(jobId: string): Promise<void> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

  if (!job) return;

  const records = await db
    .select()
    .from(processingRecords)
    .where(eq(processingRecords.jobId, jobId));

  const totalRecords = records.length;
  const completedRecords = records.filter(
    (r) => r.status === "completed",
  ).length;
  const failedRecords = records.filter((r) => r.status === "failed").length;
  const processingRecords_ = records.filter(
    (r) => r.status === "processing",
  ).length;
  const processedRecords = completedRecords + failedRecords;

  let newStatus = job.status;

  // Determine job status
  if (processedRecords === totalRecords) {
    // All records processed
    if (failedRecords === totalRecords) {
      newStatus = "failed";
    } else if (failedRecords > 0) {
      newStatus = "completed_with_errors";
    } else {
      newStatus = "completed";
    }
  } else if (processingRecords_ > 0 || processedRecords > 0) {
    // Some records are processing or completed
    newStatus = "processing";
  }

  // Update job
  await db
    .update(jobs)
    .set({
      status: newStatus,
      processedRecords,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, jobId));

  console.log(
    `[Processor] Updated job ${jobId}: ${processedRecords}/${totalRecords} records, status: ${newStatus}`,
  );
}

/**
 * Process pending records with parallel execution
 * Processes up to 5 records in parallel
 */
export async function processPendingRecords(): Promise<{
  jobsProcessed: number;
  recordsProcessed: number;
}> {
  console.log("[Processor] Starting to process pending records...");

  // Get all pending jobs
  const pendingJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "pending"));

  if (pendingJobs.length === 0) {
    // Also check for processing jobs that might have pending records
    const processingJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "processing"));

    if (processingJobs.length === 0) {
      console.log("[Processor] No pending or processing jobs found");
      return { jobsProcessed: 0, recordsProcessed: 0 };
    }

    // Process records from processing jobs
    const allPendingRecords = [];
    for (const job of processingJobs) {
      const records = await db
        .select()
        .from(processingRecords)
        .where(
          and(
            eq(processingRecords.jobId, job.id),
            eq(processingRecords.status, "pending"),
          ),
        )
        .limit(5);

      allPendingRecords.push(...records);
    }

    if (allPendingRecords.length === 0) {
      console.log("[Processor] No pending records in processing jobs");
      return { jobsProcessed: 0, recordsProcessed: 0 };
    }

    // Process up to 5 records in parallel
    const recordsToProcess = allPendingRecords.slice(0, 5);
    console.log(
      `[Processor] Processing ${recordsToProcess.length} records in parallel`,
    );

    await Promise.allSettled(
      recordsToProcess.map((record) => processRecord(record.id)),
    );

    // Update job statuses
    const uniqueJobIds = Array.from(
      new Set(recordsToProcess.map((r) => r.jobId)),
    );
    await Promise.all(uniqueJobIds.map(updateJobStatus));

    return {
      jobsProcessed: uniqueJobIds.length,
      recordsProcessed: recordsToProcess.length,
    };
  }

  // Process the first pending job
  const job = pendingJobs[0];
  console.log(`[Processor] Processing job ${job.id}: ${job.filename}`);

  // Get up to 5 pending records from this job
  const pendingRecordsForJob = await db
    .select()
    .from(processingRecords)
    .where(
      and(
        eq(processingRecords.jobId, job.id),
        eq(processingRecords.status, "pending"),
      ),
    )
    .limit(5);

  if (pendingRecordsForJob.length === 0) {
    console.log(`[Processor] No pending records for job ${job.id}`);
    await updateJobStatus(job.id);
    return { jobsProcessed: 1, recordsProcessed: 0 };
  }

  console.log(
    `[Processor] Processing ${pendingRecordsForJob.length} records in parallel`,
  );

  // Process records in parallel
  await Promise.allSettled(
    pendingRecordsForJob.map((record) => processRecord(record.id)),
  );

  // Update job status
  await updateJobStatus(job.id);

  return {
    jobsProcessed: 1,
    recordsProcessed: pendingRecordsForJob.length,
  };
}
