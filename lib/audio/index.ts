/**
 * Audio Processing Utilities
 *
 * Shared utilities for transcribing, summarizing, and translating audio files.
 * Use these in your API routes or scripts.
 *
 * @example
 * import { transcribeAudio, summarizeSalesCall, translateSummary } from '@/lib/audio';
 *
 * // In an API route
 * const audioFile = formData.get('audio') as File;
 * const transcription = await transcribeAudio(audioFile);
 * const summary = await summarizeSalesCall(transcription);
 *
 * // Translate to English if needed
 * const englishSummary = await translateSummary(summary.raw, 'en');
 *
 * @example
 * // In a script (with file path)
 * import { transcribeAudioFromPath, summarizeSalesCall } from '@/lib/audio';
 *
 * const transcription = await transcribeAudioFromPath('./data/voice-sales-calls/call.ogg');
 * const summary = await summarizeSalesCall(transcription);
 */

// Transcription utilities
export { transcribeAudio, transcribeAudioFromPath } from "./transcribe";

// Summarization utilities
export {
  summarizeSalesCall,
  getSalesCallSummary,
  type SalesSummary,
} from "./summarize";

// Translation utilities
export {
  translateText,
  translateTranscription,
  translateSummary,
  LANGUAGE_NAMES,
  type Language,
} from "./translate";
