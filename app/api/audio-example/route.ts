import { NextResponse } from "next/server";
import {
  transcribeAudio,
  summarizeSalesCall,
  translateTranscription,
  translateSummary,
  type SalesSummary,
} from "@/lib/audio";

/**
 * Audio Transcription, Summarization & Translation API
 *
 * This endpoint demonstrates the full audio processing pipeline using shared utilities:
 * 1. Receive audio via FormData
 * 2. Transcribe with OpenAI Whisper API
 * 3. Generate a structured summary with GPT-5
 * 4. Optionally translate both transcription and summary
 *
 * All the heavy lifting is done by the shared utilities in lib/audio/
 * Participants can easily reuse these in their own apps.
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // ============================================
    // STEP 1: Extract audio and options from FormData
    // ============================================
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const translateTo = formData.get("translateTo") as string | null;

    // Validate audio file
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided. Please upload or record audio." },
        { status: 400 },
      );
    }

    console.log("Processing audio:", {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(2)} KB`,
      translateTo: translateTo || "none",
    });

    // ============================================
    // STEP 2: Transcribe with Whisper
    // ============================================
    console.log("Step 1: Transcribing...");
    const transcription = await transcribeAudio(audioFile);

    // ============================================
    // STEP 3: Generate summary
    // ============================================
    console.log("Step 2: Generating summary...");
    const summary: SalesSummary = await summarizeSalesCall(transcription);

    // ============================================
    // STEP 4: Translate if requested
    // ============================================
    let translatedTranscription: string | null = null;
    let translatedSummaryText: string | null = null;

    if (translateTo) {
      console.log(`Step 3: Translating to ${translateTo}...`);

      // Translate both transcription and summary in parallel
      const [transTranscript, transSummary] = await Promise.all([
        translateTranscription(transcription, translateTo),
        translateSummary(summary.raw, translateTo),
      ]);

      translatedTranscription = transTranscript;
      translatedSummaryText = transSummary;
    }

    // ============================================
    // STEP 5: Return results
    // ============================================
    const processingTime = Date.now() - startTime;
    console.log(
      `Processing complete in ${(processingTime / 1000).toFixed(2)}s`,
    );

    return NextResponse.json({
      // Original transcription from Whisper
      transcription,

      // Translated transcription (null if no translation requested)
      translatedTranscription,

      // Structured summary
      summary: {
        raw: summary.raw,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        actionItems: summary.actionItems,
        nextSteps: summary.nextSteps,
      },

      // Translated summary (null if no translation requested)
      translatedSummary: translatedSummaryText,

      // Metadata
      metadata: {
        audioFileName: audioFile.name,
        audioSize: audioFile.size,
        translateTo: translateTo || null,
        processingTimeMs: processingTime,
      },
    });
  } catch (error) {
    console.error("Audio processing error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 },
        );
      }

      if (error.message.includes("Invalid file format")) {
        return NextResponse.json(
          {
            error:
              "Invalid audio format. Please use MP3, WAV, M4A, OGG, or WebM.",
          },
          { status: 400 },
        );
      }

      if (error.message.includes("maximum")) {
        return NextResponse.json(
          { error: "Audio file is too large. Maximum size is 25MB." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process audio. Please try again." },
      { status: 500 },
    );
  }
}
