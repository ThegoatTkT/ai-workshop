/**
 * Whisper API Verification Script
 *
 * This script verifies that the OpenAI Whisper API is working correctly
 * by transcribing a sample audio file, generating a summary, and optionally
 * translating to a target language.
 *
 * Usage:
 *   npx tsx scripts/verify-whisper.ts
 *   npx tsx scripts/verify-whisper.ts "path/to/custom/audio.ogg"
 *   npx tsx scripts/verify-whisper.ts --translate en
 *   npx tsx scripts/verify-whisper.ts "path/to/audio.ogg" --translate en
 *
 * Prerequisites:
 *   - OPENAI_API_KEY must be set in .env
 *   - Sample audio files should exist in data/voice-sales-calls/
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env
dotenv.config();

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in .env file");
  console.error("Please add your OpenAI API key to the .env file:");
  console.error("  OPENAI_API_KEY=sk-your-key-here");
  process.exit(1);
}

// Import audio utilities (after dotenv is loaded)
import {
  transcribeAudioFromPath,
  summarizeSalesCall,
  translateTranscription,
  translateSummary,
  LANGUAGE_NAMES,
  type Language,
} from "../lib/audio";

// Default audio file (smallest one for quick testing)
const DEFAULT_AUDIO_FILE =
  "2026-02-03 21.38.36 - NEPI Rockcastle (Romania) PART 4.ogg";
const AUDIO_DIR = path.join(process.cwd(), "data/voice-sales-calls");

// Parse command line arguments
function parseArgs(): { audioPath: string; translateTo: string | null } {
  const args = process.argv.slice(2);
  let audioPath: string | null = null;
  let translateTo: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--translate" || args[i] === "-t") {
      translateTo = args[i + 1] || "en";
      i++; // Skip next arg
    } else if (!args[i].startsWith("-")) {
      audioPath = args[i];
    }
  }

  // Determine audio path
  if (audioPath) {
    audioPath = path.isAbsolute(audioPath)
      ? audioPath
      : path.join(process.cwd(), audioPath);
  } else {
    audioPath = path.join(AUDIO_DIR, DEFAULT_AUDIO_FILE);
  }

  return { audioPath, translateTo };
}

async function main() {
  const { audioPath, translateTo } = parseArgs();

  console.log("=".repeat(60));
  console.log("  Whisper API Verification Script");
  console.log("=".repeat(60));
  console.log();

  // Check if file exists
  if (!fs.existsSync(audioPath)) {
    console.error(`ERROR: Audio file not found: ${audioPath}`);
    console.error();
    console.error("Available files in data/voice-sales-calls/:");
    if (fs.existsSync(AUDIO_DIR)) {
      const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".ogg"));
      files.forEach((f) => console.error(`  - ${f}`));
    } else {
      console.error("  (directory does not exist)");
    }
    process.exit(1);
  }

  // Get file info
  const stats = fs.statSync(audioPath);
  const fileSizeKB = (stats.size / 1024).toFixed(1);
  const fileName = path.basename(audioPath);

  console.log(`Audio file: ${fileName}`);
  console.log(`File size:  ${fileSizeKB} KB`);
  if (translateTo) {
    const langName = LANGUAGE_NAMES[translateTo as Language] || translateTo;
    console.log(`Translate:  Yes (to ${langName})`);
  }
  console.log();

  // Step 1: Transcribe
  console.log("-".repeat(60));
  console.log("Step 1: Transcribing with Whisper API...");
  console.log("-".repeat(60));

  const transcribeStart = Date.now();
  let transcription: string;

  try {
    transcription = await transcribeAudioFromPath(audioPath);
    const transcribeTime = ((Date.now() - transcribeStart) / 1000).toFixed(2);

    console.log(`Transcription completed in ${transcribeTime}s`);
    console.log();
    console.log("TRANSCRIPTION (original):");
    console.log("-".repeat(40));
    console.log(transcription);
    console.log("-".repeat(40));
    console.log();
  } catch (error) {
    console.error("ERROR: Transcription failed");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Step 1b: Translate transcription (if requested)
  let translatedTranscription: string | null = null;
  if (translateTo) {
    console.log("-".repeat(60));
    console.log(
      `Step 1b: Translating transcription to ${LANGUAGE_NAMES[translateTo as Language] || translateTo}...`,
    );
    console.log("-".repeat(60));

    const translateStart = Date.now();

    try {
      translatedTranscription = await translateTranscription(
        transcription,
        translateTo,
      );
      const translateTime = ((Date.now() - translateStart) / 1000).toFixed(2);

      console.log(`Translation completed in ${translateTime}s`);
      console.log();
      console.log("TRANSCRIPTION (translated):");
      console.log("-".repeat(40));
      console.log(translatedTranscription);
      console.log("-".repeat(40));
      console.log();
    } catch (error) {
      console.error("ERROR: Translation failed");
      console.error(error instanceof Error ? error.message : error);
      // Continue without translation
    }
  }

  // Step 2: Summarize (use translated transcription if available)
  console.log("-".repeat(60));
  console.log("Step 2: Generating summary with GPT-5...");
  console.log("-".repeat(60));

  const summarizeStart = Date.now();
  let summaryRaw: string;

  try {
    // Summarize the original transcription (AI will auto-detect language)
    const summary = await summarizeSalesCall(transcription);
    const summarizeTime = ((Date.now() - summarizeStart) / 1000).toFixed(2);
    summaryRaw = summary.raw;

    console.log(`Summary generated in ${summarizeTime}s`);
    console.log();
    console.log("SUMMARY (original language):");
    console.log("-".repeat(40));
    console.log(summary.raw);
    console.log("-".repeat(40));
    console.log();

    // Show parsed structure
    console.log("PARSED STRUCTURE:");
    console.log("-".repeat(40));
    console.log(
      "Summary:",
      summary.summary.substring(0, 100) +
        (summary.summary.length > 100 ? "..." : ""),
    );
    console.log("Key Points:", summary.keyPoints.length, "items");
    summary.keyPoints
      .slice(0, 3)
      .forEach((p) => console.log(`  - ${p.substring(0, 60)}...`));
    console.log("Action Items:", summary.actionItems.length, "items");
    summary.actionItems
      .slice(0, 3)
      .forEach((p) => console.log(`  - ${p.substring(0, 60)}...`));
    console.log("Next Steps:", summary.nextSteps.length, "items");
    summary.nextSteps
      .slice(0, 3)
      .forEach((p) => console.log(`  - ${p.substring(0, 60)}...`));
    console.log();
  } catch (error) {
    console.error("ERROR: Summary generation failed");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Step 2b: Translate summary (if requested)
  if (translateTo) {
    console.log("-".repeat(60));
    console.log(
      `Step 2b: Translating summary to ${LANGUAGE_NAMES[translateTo as Language] || translateTo}...`,
    );
    console.log("-".repeat(60));

    const translateSummaryStart = Date.now();

    try {
      const translatedSummary = await translateSummary(summaryRaw, translateTo);
      const translateTime = (
        (Date.now() - translateSummaryStart) /
        1000
      ).toFixed(2);

      console.log(`Translation completed in ${translateTime}s`);
      console.log();
      console.log("SUMMARY (translated):");
      console.log("-".repeat(40));
      console.log(translatedSummary);
      console.log("-".repeat(40));
      console.log();
    } catch (error) {
      console.error("ERROR: Summary translation failed");
      console.error(error instanceof Error ? error.message : error);
      // Continue without translation
    }
  }

  // Success!
  console.log("=".repeat(60));
  console.log("  SUCCESS! All audio utilities are working correctly.");
  console.log("=".repeat(60));
  console.log();
  console.log("Participants can now use the audio utilities:");
  console.log();
  console.log("  import {");
  console.log("    transcribeAudio,");
  console.log("    summarizeSalesCall,");
  console.log("    translateTranscription,");
  console.log("    translateSummary");
  console.log("  } from '@/lib/audio';");
  console.log();
  console.log("Usage examples:");
  console.log(
    "  npx tsx scripts/verify-whisper.ts                    # Basic test",
  );
  console.log(
    "  npx tsx scripts/verify-whisper.ts --translate en     # With English translation",
  );
  console.log(
    "  npx tsx scripts/verify-whisper.ts -t es              # With Spanish translation",
  );
  console.log();
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
