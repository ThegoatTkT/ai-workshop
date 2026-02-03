import { openai } from "@/lib/openai";

/**
 * Supported languages for translation
 */
export type Language =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "ja"
  | "ko"
  | "ar"
  | "hi"
  | "nl"
  | "pl"
  | "tr"
  | "uk"
  | "vi"
  | "th"
  | "id"
  | "cs"
  | "ro"
  | "hu"
  | "el"
  | "sv"
  | "da"
  | "fi"
  | "no"
  | "he";

/**
 * Language names for display
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  el: "Greek",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  he: "Hebrew",
};

/**
 * Translate text to a target language using GPT
 *
 * This function translates any text to the specified target language
 * while preserving the original meaning and tone.
 *
 * @param text - The text to translate
 * @param targetLanguage - The target language code (e.g., 'en', 'es', 'de')
 * @param options - Optional configuration
 * @returns The translated text
 *
 * @example
 * // Translate Russian text to English
 * const translated = await translateText(russianText, 'en');
 *
 * @example
 * // Translate with context hint
 * const translated = await translateText(text, 'es', {
 *   context: 'This is a business sales call summary'
 * });
 */
export async function translateText(
  text: string,
  targetLanguage: Language | string,
  options?: {
    /** Additional context to help with translation accuracy */
    context?: string;
    /** Maximum tokens for response */
    maxTokens?: number;
  },
): Promise<string> {
  const languageName =
    LANGUAGE_NAMES[targetLanguage as Language] || targetLanguage;

  const contextHint = options?.context ? `\n\nContext: ${options.context}` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini-2025-08-07",
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text to ${languageName}.

Guidelines:
- Preserve the original meaning, tone, and intent
- Keep formatting intact (bullet points, headers, etc.)
- Maintain any technical terms or proper nouns appropriately
- If the text is already in ${languageName}, return it unchanged
- Only output the translation, no explanations${contextHint}`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_completion_tokens: options?.maxTokens || 4000,
  });

  return response.choices[0].message.content || text;
}

/**
 * Translate a sales call transcription to a target language
 *
 * Optimized for sales call content with appropriate context.
 *
 * @param transcription - The transcription text to translate
 * @param targetLanguage - The target language code
 * @returns The translated transcription
 *
 * @example
 * const englishTranscript = await translateTranscription(russianTranscript, 'en');
 */
export async function translateTranscription(
  transcription: string,
  targetLanguage: Language | string,
): Promise<string> {
  return translateText(transcription, targetLanguage, {
    context:
      "This is a transcription of a sales call or business voice memo. Preserve business terminology and maintain a professional tone.",
  });
}

/**
 * Translate a sales call summary to a target language
 *
 * Optimized for structured summary content with appropriate context.
 *
 * @param summary - The summary text (markdown) to translate
 * @param targetLanguage - The target language code
 * @returns The translated summary
 *
 * @example
 * const englishSummary = await translateSummary(russianSummary, 'en');
 */
export async function translateSummary(
  summary: string,
  targetLanguage: Language | string,
): Promise<string> {
  return translateText(summary, targetLanguage, {
    context:
      "This is a structured summary of a sales call for CRM documentation. Preserve the markdown formatting (headers, bullet points) and maintain a professional business tone.",
  });
}
