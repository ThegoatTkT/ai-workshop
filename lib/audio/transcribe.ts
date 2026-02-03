import { openai } from "@/lib/openai";

/**
 * Transcribe an audio file using OpenAI Whisper API
 *
 * This function takes an audio file and returns the transcribed text.
 * It supports various audio formats: MP3, WAV, M4A, OGG, WebM, etc.
 *
 * @param file - The audio file to transcribe (File object from FormData or fs)
 * @param options - Optional configuration
 * @returns The transcribed text
 *
 * @example
 * // In an API route with FormData
 * const formData = await request.formData();
 * const audioFile = formData.get('audio') as File;
 * const text = await transcribeAudio(audioFile);
 *
 * @example
 * // With a file from the filesystem
 * import { createReadStream } from 'fs';
 * const file = createReadStream('./audio.mp3');
 * const text = await transcribeAudio(file);
 */
export async function transcribeAudio(
  file: File | NodeJS.ReadableStream,
  options?: {
    /** Language code (e.g., 'en', 'es', 'de') for better accuracy */
    language?: string;
    /** Custom prompt to guide transcription style */
    prompt?: string;
  },
): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    file: file as File,
    model: "whisper-1",
    language: options?.language,
    prompt: options?.prompt,
  });

  return response.text;
}

/**
 * Transcribe audio from a file path (convenience function for scripts)
 *
 * @param filePath - Path to the audio file
 * @param options - Optional configuration
 * @returns The transcribed text
 *
 * @example
 * const text = await transcribeAudioFromPath('./data/voice-sales-calls/call.ogg');
 */
export async function transcribeAudioFromPath(
  filePath: string,
  options?: {
    language?: string;
    prompt?: string;
  },
): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");

  // Get filename for the File object
  const filename = path.basename(filePath);

  // Read file into buffer
  const buffer = fs.readFileSync(filePath);

  // Create a File-like object that OpenAI SDK accepts
  const file = new File([buffer], filename, {
    type: getAudioMimeType(filename),
  });

  return transcribeAudio(file, options);
}

/**
 * Get MIME type based on file extension
 */
function getAudioMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/m4a",
    ogg: "audio/ogg",
    webm: "audio/webm",
    flac: "audio/flac",
  };
  return mimeTypes[ext || ""] || "audio/mpeg";
}
