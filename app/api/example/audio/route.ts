import { NextResponse } from "next/server";
import { transcribeAudio, summarizeSalesCall } from "@/lib/audio";

/**
 * Audio Transcription and Summary API Route
 *
 * This endpoint demonstrates the pattern for handling audio files with AI:
 * 1. Receive audio via FormData
 * 2. Transcribe with OpenAI Whisper API (using shared utility)
 * 3. Generate a structured summary with GPT-5 (using shared utility)
 * 4. Return both results to the client
 *
 * The actual transcription and summarization logic is in lib/audio/
 * so participants can easily reuse it in their own apps.
 *
 * Workshop participants can study this pattern and adapt it for their own use cases.
 */
export async function POST(request: Request) {
  try {
    // ============================================
    // STEP 1: Extract the audio file from FormData
    // ============================================

    // FormData is how browsers send files to servers
    // It's different from JSON - it can contain binary data like audio
    const formData = await request.formData();

    // Get the audio file from the form data
    // The key 'audio' must match what the frontend sends
    const audioFile = formData.get("audio");

    // Validate that we received a file
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided. Please upload or record audio." },
        { status: 400 },
      );
    }

    // Log some info for debugging (visible in terminal)
    console.log("Received audio file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(2)} KB`,
    });

    // ============================================
    // STEP 2: Transcribe with OpenAI Whisper API
    // ============================================

    // Use the shared transcription utility from lib/audio/
    // This calls whisper-1 model under the hood
    const transcriptionText = await transcribeAudio(audioFile);

    // Log the transcription for debugging
    console.log("Transcription:", transcriptionText.substring(0, 100) + "...");

    // ============================================
    // STEP 3: Generate a structured summary with GPT-5
    // ============================================

    // Use the shared summarization utility from lib/audio/
    // This calls gpt-5-mini with a sales-focused prompt
    const summary = await summarizeSalesCall(transcriptionText);

    // ============================================
    // STEP 4: Return both results to the client
    // ============================================

    return NextResponse.json({
      // The raw transcription from Whisper
      transcription: transcriptionText,

      // The AI-generated summary (raw markdown)
      summary: summary.raw,

      // Structured summary data (for programmatic access)
      structured: {
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        actionItems: summary.actionItems,
        nextSteps: summary.nextSteps,
      },

      // Optional: include some metadata
      metadata: {
        audioFileName: audioFile.name,
        audioSize: audioFile.size,
        transcriptionLength: transcriptionText.length,
      },
    });
  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================

    // Log the full error for debugging (visible in terminal)
    console.error("Audio transcription error:", error);

    // Check for specific OpenAI errors
    if (error instanceof Error) {
      // Handle rate limiting
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 },
        );
      }

      // Handle invalid audio format
      if (error.message.includes("Invalid file format")) {
        return NextResponse.json(
          { error: "Invalid audio format. Please use MP3, WAV, M4A, or WebM." },
          { status: 400 },
        );
      }

      // Handle file too large
      if (error.message.includes("maximum")) {
        return NextResponse.json(
          { error: "Audio file is too large. Maximum size is 25MB." },
          { status: 400 },
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Failed to process audio. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Note: In Next.js 14 App Router, FormData is handled automatically.
 * No additional configuration is needed - the route can receive
 * multipart/form-data requests without any special setup.
 *
 * The transcription and summarization logic is now in shared utilities:
 * - lib/audio/transcribe.ts - Whisper API wrapper
 * - lib/audio/summarize.ts - GPT-5 summarization
 *
 * You can import these directly in your own routes:
 *   import { transcribeAudio, summarizeSalesCall } from '@/lib/audio';
 */
