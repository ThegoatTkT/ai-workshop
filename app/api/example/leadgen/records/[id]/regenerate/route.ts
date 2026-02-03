import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, processingRecords } from "@/lib/db/schema";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";
import {
  generateSingleMessage,
  interpolatePrompt,
} from "@/lib/agents/processor";
import { getSettingsMap, DEFAULT_PROMPTS } from "@/lib/settings";
import {
  getRegionalToneKey,
  getRegionDisplayName,
} from "@/lib/agents/region-mapper";

interface NewsItem {
  title: string;
  date: string;
  source: string;
  summary: string;
}

interface MatchedCase {
  title: string;
  link: string;
}

interface RegenerateRequest {
  messageNumber: 1 | 2 | 3 | "all";
  selectedNewsIndices: number[];
  selectedCaseIds: string[];
  currentMessageText?: string;
  regionalToneKey?: string; // Optional override for regional tone (e.g., 'regional_tone_usa')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authentication (async - also verifies user exists in DB)
    const user = await getUserFromRequestVerified(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body: RegenerateRequest = await request.json();
    const {
      messageNumber,
      selectedNewsIndices,
      selectedCaseIds,
      currentMessageText,
      regionalToneKey,
    } = body;

    if (![1, 2, 3, "all"].includes(messageNumber)) {
      return NextResponse.json(
        { error: 'messageNumber must be 1, 2, 3, or "all"' },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(selectedNewsIndices) ||
      !Array.isArray(selectedCaseIds)
    ) {
      return NextResponse.json(
        { error: "selectedNewsIndices and selectedCaseIds must be arrays" },
        { status: 400 },
      );
    }

    // 3. Fetch the processing record
    const [record] = await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.id, id))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // 4. Verify ownership through the job
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, record.jobId))
      .limit(1);

    if (!job || job.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Parse company news and filter by selected indices
    let allNews: NewsItem[] = [];
    try {
      allNews = JSON.parse(record.companyNews || "[]");
    } catch {
      // Keep empty array
    }

    const selectedNews = selectedNewsIndices
      .filter((idx: number) => idx >= 0 && idx < allNews.length)
      .map((idx: number) => allNews[idx]);

    // 6. Parse matched cases and filter by selected IDs
    let allCases: MatchedCase[] = [];
    try {
      const parsed = JSON.parse(record.matchedCaseIds || "[]");
      allCases = parsed.map((item: any) => {
        if (typeof item === "string") {
          return { title: item, link: "" };
        }
        return { title: item.title || "Unknown", link: item.link || "" };
      });
    } catch {
      // Keep empty array
    }

    // Generate case indices for filtering (ID format: 'case-N' or 'legacy-N')
    const selectedCases = selectedCaseIds
      .map((id: string) => {
        const index = parseInt(
          id.replace("case-", "").replace("legacy-", ""),
          10,
        );
        return !isNaN(index) && index < allCases.length
          ? allCases[index]
          : null;
      })
      .filter((c): c is MatchedCase => c !== null);

    // 7. Fetch regional tone (with optional override)
    const country = record.companyRegion || "USA";
    const effectiveToneKey = regionalToneKey || getRegionalToneKey(country);
    const toneSettings = await getSettingsMap([effectiveToneKey]);
    const regionalToneRules = toneSettings[effectiveToneKey] || "";

    // Determine region display name from the effective tone key
    const toneToRegion: Record<string, string> = {
      regional_tone_uk: "UK",
      regional_tone_usa: "USA",
      regional_tone_mena: "MENA",
      regional_tone_eu: "EU",
      regional_tone_dach: "DACH",
    };
    const effectiveRegionName = regionalToneKey
      ? toneToRegion[regionalToneKey] || "Custom"
      : getRegionDisplayName(country);

    // 8. Fetch prompt templates (fetch all if regenerating all)
    const promptKeys =
      messageNumber === "all"
        ? [
            "message1_prompt",
            "message2_prompt",
            "message3_prompt",
            "message_system_prompt",
          ]
        : [`message${messageNumber}_prompt`, "message_system_prompt"];
    const prompts = await getSettingsMap(promptKeys);
    const baseSystemPrompt =
      prompts["message_system_prompt"] ||
      DEFAULT_PROMPTS["message_system_prompt"] ||
      "";

    // 9. Build system prompt with regional tone
    const systemPrompt = regionalToneRules
      ? `${baseSystemPrompt}\n\nIMPORTANT - Regional Communication Guidelines for ${country} (${effectiveRegionName} region):\n${regionalToneRules}`
      : baseSystemPrompt;

    // 10. Build focused context strings
    const focusedNewsText =
      selectedNews.length > 0
        ? selectedNews
            .map(
              (n) => `- ${n.title} (${n.date}): ${n.summary || "No summary"}`,
            )
            .join("\n")
        : "(No specific news selected)";

    const focusedCasesText =
      selectedCases.length > 0
        ? `Selected Case Studies:\n${selectedCases.map((c) => `- ${c.title}${c.link ? ` (URL: ${c.link})` : ""}`).join("\n")}`
        : "(No specific case studies selected)";

    // 11. Build template variables (common for all messages)
    const variables: Record<string, string> = {
      firstName: record.firstName,
      lastName: record.lastName,
      companyName: record.companyName,
      country: country,
      industry: record.companyIndustry || "Unknown",
      researchContent: "", // Not needed for regeneration
      enrichedNews: focusedNewsText,
      matchedCasesText: focusedCasesText,
    };

    // Helper function to build enhanced prompt for a message number
    const buildEnhancedPrompt = (
      msgNum: number,
      baseTemplate: string,
    ) => `${baseTemplate}

REGENERATION CONTEXT:
The sales person has selected specific context for this message regeneration.
Focus SPECIFICALLY on the selected news and case studies provided.

SELECTED NEWS ITEMS:
${focusedNewsText}

${focusedCasesText}

Instructions for regeneration:
1. Focus on the SELECTED news and cases above (not general research)
2. Maintain the same message type structure and tone requirements
3. Follow regional communication guidelines`;

    // 12. Handle single message or all messages regeneration
    if (messageNumber === "all") {
      console.log(
        `[Regenerate] Regenerating all messages for record ${record.id} with tone ${effectiveToneKey}`,
      );

      // Generate all 3 messages in parallel
      const [result1, result2, result3] = await Promise.all([
        generateSingleMessage(
          buildEnhancedPrompt(
            1,
            prompts["message1_prompt"] ||
              DEFAULT_PROMPTS["message1_prompt"] ||
              "",
          ),
          systemPrompt,
          variables,
        ),
        generateSingleMessage(
          buildEnhancedPrompt(
            2,
            prompts["message2_prompt"] ||
              DEFAULT_PROMPTS["message2_prompt"] ||
              "",
          ),
          systemPrompt,
          variables,
        ),
        generateSingleMessage(
          buildEnhancedPrompt(
            3,
            prompts["message3_prompt"] ||
              DEFAULT_PROMPTS["message3_prompt"] ||
              "",
          ),
          systemPrompt,
          variables,
        ),
      ]);

      // Save all messages and the new tone to the database
      await db
        .update(processingRecords)
        .set({
          message1: result1.content,
          message2: result2.content,
          message3: result3.content,
          appliedRegionalTone: effectiveToneKey,
          selectedNewsIndices: JSON.stringify(selectedNewsIndices),
          selectedCaseIndices: JSON.stringify(
            selectedCaseIds
              .map((id) =>
                parseInt(id.replace("case-", "").replace("legacy-", ""), 10),
              )
              .filter((n) => !isNaN(n)),
          ),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(processingRecords.id, id));

      console.log(
        `[Regenerate] All messages regenerated and saved for record ${record.id}`,
      );

      return NextResponse.json({
        message1: result1.content,
        message2: result2.content,
        message3: result3.content,
        appliedRegionalTone: effectiveToneKey,
        messageNumber: "all",
      });
    }

    // Single message regeneration
    const basePromptTemplate =
      prompts[`message${messageNumber}_prompt`] ||
      DEFAULT_PROMPTS[
        `message${messageNumber}_prompt` as keyof typeof DEFAULT_PROMPTS
      ] ||
      "";
    const enhancedPromptTemplate = `${basePromptTemplate}

REGENERATION CONTEXT:
The sales person has selected specific context for this message regeneration.
Focus SPECIFICALLY on the selected news and case studies provided.

SELECTED NEWS ITEMS:
${focusedNewsText}

${focusedCasesText}

PREVIOUS MESSAGE VERSION (may contain sales person's edits, notes, or talking points to incorporate):
---
${currentMessageText || "(No previous version)"}
---

Instructions for regeneration:
1. Focus on the SELECTED news and cases above (not general research)
2. Incorporate any specific talking points or edits from the previous version
3. Maintain the same message type structure and tone requirements
4. Follow regional communication guidelines`;

    // 13. Generate the new message
    console.log(
      `[Regenerate] Generating message ${messageNumber} for record ${record.id}`,
    );
    const result = await generateSingleMessage(
      enhancedPromptTemplate,
      systemPrompt,
      variables,
    );

    // 14. Auto-save the regenerated message to the database
    const fieldName = `message${messageNumber}` as
      | "message1"
      | "message2"
      | "message3";
    await db
      .update(processingRecords)
      .set({
        [fieldName]: result.content,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(processingRecords.id, id));

    console.log(
      `[Regenerate] Message ${messageNumber} regenerated and saved for record ${record.id}`,
    );

    // 15. Return the result
    return NextResponse.json({
      content: result.content,
      messageNumber,
    });
  } catch (error: any) {
    console.error("[Regenerate] Error regenerating message:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
