import { openai } from "@/lib/openai";

/**
 * Sales call summary structure
 */
export interface SalesSummary {
  /** Brief 2-3 sentence overview */
  summary: string;
  /** Main topics and points discussed */
  keyPoints: string[];
  /** Follow-up tasks and commitments */
  actionItems: string[];
  /** Recommended next steps */
  nextSteps: string[];
  /** Raw markdown output (full summary) */
  raw: string;
}

/**
 * System prompt for sales call summarization
 */
const SALES_SUMMARY_PROMPT = `You are a sales call summarizer helping salespeople document their calls quickly.

Given a transcription of a sales call or voice memo, generate a structured summary that can be pasted directly into a CRM.

Your summary should include:

## Summary
A brief 2-3 sentence overview of what the call was about.

## Key Points Discussed
- Bullet points of the main topics covered
- Include any specific products, features, or solutions mentioned
- Note any concerns or objections raised

## Action Items
- List any follow-up tasks or commitments made
- Include deadlines if mentioned
- Note any materials that need to be sent

## Next Steps
- What should happen next in the sales process
- Recommended follow-up timing
- Any preparation needed for the next interaction

Keep the summary professional, concise, and actionable. Use clear headers and bullet points for easy scanning.`;

/**
 * Summarize a sales call transcription using AI
 *
 * Takes raw transcription text and generates a structured summary
 * suitable for pasting into a CRM or sharing with team members.
 *
 * @param transcription - The raw transcription text from a sales call
 * @param options - Optional configuration
 * @returns Structured summary with key points, action items, and next steps
 *
 * @example
 * const transcription = await transcribeAudio(audioFile);
 * const summary = await summarizeSalesCall(transcription);
 * console.log(summary.actionItems);
 */
export async function summarizeSalesCall(
  transcription: string,
  options?: {
    /** Custom system prompt to override default */
    systemPrompt?: string;
    /** Maximum tokens for response */
    maxTokens?: number;
  },
): Promise<SalesSummary> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini-2025-08-07",
    messages: [
      {
        role: "system",
        content: options?.systemPrompt || SALES_SUMMARY_PROMPT,
      },
      {
        role: "user",
        content: `Please summarize this sales call transcription:\n\n${transcription}`,
      },
    ],
    // GPT-5-mini is a reasoning model that uses tokens for internal reasoning
    // We need enough tokens for both reasoning AND output (default 4000)
    max_completion_tokens: options?.maxTokens || 4000,
  });

  const rawContent =
    response.choices[0].message.content || "Unable to generate summary.";

  // Parse the markdown response into structured data
  return parseSummaryMarkdown(rawContent);
}

/**
 * Parse markdown summary into structured SalesSummary object
 */
function parseSummaryMarkdown(markdown: string): SalesSummary {
  const summary: SalesSummary = {
    summary: "",
    keyPoints: [],
    actionItems: [],
    nextSteps: [],
    raw: markdown,
  };

  // Split into sections - handle both "## Header" and "Header\n" formats
  // First try splitting by ## headers
  let sections = markdown.split(/^##\s+/m);

  // If that didn't produce multiple sections, try splitting by lines that look like headers
  // (single line followed by bullet points or paragraphs)
  if (sections.length <= 1) {
    sections = markdown.split(
      /\n(?=(?:Summary|Key Points|Action Items|Next Steps)[^\n]*\n)/i,
    );
  }

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines[0]?.toLowerCase() || "";
    const content = lines.slice(1).join("\n").trim();

    if (header.includes("summary") && !header.includes("key")) {
      // Get first paragraph as summary
      summary.summary = content.split("\n\n")[0] || content;
    } else if (header.includes("key point")) {
      summary.keyPoints = extractBulletPoints(content);
    } else if (header.includes("action")) {
      summary.actionItems = extractBulletPoints(content);
    } else if (header.includes("next step")) {
      summary.nextSteps = extractBulletPoints(content);
    }
  }

  return summary;
}

/**
 * Extract bullet points from markdown content
 */
function extractBulletPoints(content: string): string[] {
  const bullets: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      bullets.push(trimmed.slice(2).trim());
    } else if (/^\d+\.\s/.test(trimmed)) {
      bullets.push(trimmed.replace(/^\d+\.\s*/, "").trim());
    }
  }

  return bullets;
}

/**
 * Get just the raw markdown summary (simpler API)
 *
 * @param transcription - The raw transcription text
 * @returns Markdown-formatted summary string
 *
 * @example
 * const summary = await getSalesCallSummary(transcription);
 * // Returns raw markdown string
 */
export async function getSalesCallSummary(
  transcription: string,
): Promise<string> {
  const result = await summarizeSalesCall(transcription);
  return result.raw;
}
