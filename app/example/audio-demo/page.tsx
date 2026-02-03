"use client";

/**
 * Post-Sales Call Processor - Audio Demo Page
 *
 * This demo shows workshop participants how to:
 * 1. Upload audio files (drag & drop)
 * 2. Record audio directly from the microphone
 * 3. Transcribe audio using OpenAI Whisper API
 * 4. Generate AI summaries from transcriptions
 *
 * Perfect for salespeople who want to:
 * - Record quick voice memos after calls
 * - Upload call recordings for instant transcription
 * - Get AI-generated summaries to paste into their CRM
 */

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Mic,
  MicOff,
  Send,
  Copy,
  Check,
  FileAudio,
  Loader2,
  Info,
  Trash2,
  Home,
} from "lucide-react";

export default function AudioDemoPage() {
  // ============================================
  // STATE MANAGEMENT
  // These variables track everything the page needs to know
  // ============================================

  // The audio file that was uploaded (if any)
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Whether we're currently recording from the microphone
  const [isRecording, setIsRecording] = useState(false);

  // The recorded audio blob (raw audio data)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // The transcription text returned from OpenAI Whisper
  const [transcription, setTranscription] = useState("");

  // The AI-generated summary of the transcription
  const [summary, setSummary] = useState("");

  // Whether we're waiting for the API response
  const [loading, setLoading] = useState(false);

  // Track if we just copied something (for visual feedback)
  const [copiedField, setCopiedField] = useState<
    "transcription" | "summary" | null
  >(null);

  // Track if user is dragging a file over the drop zone
  const [isDragging, setIsDragging] = useState(false);

  // Error message to display to the user
  const [error, setError] = useState("");

  // ============================================
  // REFS
  // Refs let us access DOM elements and keep values between renders
  // ============================================

  // Reference to the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reference to the MediaRecorder (for recording audio)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Stores audio chunks while recording
  const audioChunksRef = useRef<Blob[]>([]);

  // ============================================
  // FILE UPLOAD HANDLERS
  // These functions handle drag & drop and file selection
  // ============================================

  /**
   * Called when a file is selected from the file picker
   * or dropped onto the drop zone
   */
  const handleFileSelect = (file: File) => {
    // Check if it's an audio file
    if (!file.type.startsWith("audio/")) {
      setError("Please select an audio file (MP3, WAV, M4A, etc.)");
      return;
    }

    // Clear any previous data
    setAudioFile(file);
    setRecordedBlob(null);
    setTranscription("");
    setSummary("");
    setError("");
  };

  /**
   * Handle when user drags a file over the drop zone
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent browser from opening the file
    setIsDragging(true);
  };

  /**
   * Handle when user drags away from the drop zone
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handle when user drops a file onto the drop zone
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Handle when user selects a file via the file picker
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // ============================================
  // AUDIO RECORDING HANDLERS
  // These functions manage microphone recording
  // ============================================

  /**
   * Start recording audio from the user's microphone
   */
  const startRecording = async () => {
    try {
      // Request microphone access from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a MediaRecorder to capture the audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // When audio data is available, store it
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, combine all chunks into one blob
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedBlob(audioBlob);
        setAudioFile(null); // Clear any uploaded file
        setTranscription("");
        setSummary("");

        // Stop all audio tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording!
      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "Could not access microphone. Please check your browser permissions.",
      );
    }
  };

  /**
   * Stop recording audio
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Toggle recording on/off
   */
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ============================================
  // TRANSCRIPTION HANDLER
  // This function sends audio to the API
  // ============================================

  /**
   * Send the audio to our API for transcription and summary
   */
  const handleTranscribe = async () => {
    // Make sure we have audio to transcribe
    const audioToSend = audioFile || recordedBlob;
    if (!audioToSend) {
      setError("Please upload or record audio first");
      return;
    }

    setLoading(true);
    setError("");
    setTranscription("");
    setSummary("");

    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();

      // If it's an uploaded file, use it directly
      // If it's a recorded blob, convert it to a File object
      if (audioFile) {
        formData.append("audio", audioFile);
      } else if (recordedBlob) {
        // Create a File from the Blob with a proper filename
        const file = new File([recordedBlob], "recording.webm", {
          type: "audio/webm",
        });
        formData.append("audio", file);
      }

      // Send to our API endpoint
      const response = await fetch("/api/example/audio", {
        method: "POST",
        body: formData, // Note: Don't set Content-Type header - browser sets it automatically
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      // Parse the response
      const data = await response.json();

      // Update state with the results
      setTranscription(data.transcription);
      setSummary(data.summary);
    } catch (err) {
      console.error("Transcription error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to transcribe audio. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // Helper functions for the UI
  // ============================================

  /**
   * Copy text to clipboard and show feedback
   */
  const copyToClipboard = async (
    text: string,
    field: "transcription" | "summary",
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Clear all data and start fresh
   */
  const clearAll = () => {
    setAudioFile(null);
    setRecordedBlob(null);
    setTranscription("");
    setSummary("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Get a URL to preview the audio (for the audio player)
   */
  const getAudioPreviewUrl = () => {
    if (audioFile) {
      return URL.createObjectURL(audioFile);
    }
    if (recordedBlob) {
      return URL.createObjectURL(recordedBlob);
    }
    return null;
  };

  // ============================================
  // RENDER THE PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Link
                href="/example"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Back to Example Apps"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>

              {/* Page Title */}
              <div>
                <h1 className="font-display text-xl font-bold text-primary">
                  Post-Sales Call Processor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Transcribe and summarize your sales calls with AI
                </p>
              </div>
            </div>
            <Link
              href="/example"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display text-2xl font-bold mb-2">
            <span className="text-gradient">Audio Transcription Demo</span>
          </h2>
          <p className="text-muted-foreground">
            Upload a call recording or record a voice memo, then get instant
            transcription and AI-generated summaries to paste into your CRM.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive animate-fade-in">
            {error}
          </div>
        )}

        {/* Audio Input Section */}
        <div
          className="card-elevated p-6 mb-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-4">
            1. Upload or Record Audio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${
                  isDragging
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-gray-200 hover:border-accent/50 hover:bg-gray-50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-accent" : "text-gray-400"}`}
              />
              <p className="font-medium text-foreground mb-1">
                {isDragging ? "Drop your file here" : "Upload Audio File"}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                MP3, WAV, M4A, WebM supported
              </p>
            </div>

            {/* Recording Section */}
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl">
              <button
                onClick={toggleRecording}
                disabled={loading}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-300 transform cursor-pointer
                  ${
                    isRecording
                      ? "bg-destructive text-white animate-pulse scale-110"
                      : "bg-accent text-white hover:scale-105 hover:shadow-lg"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
              <p className="font-medium text-foreground mt-4">
                {isRecording
                  ? "Recording... Click to Stop"
                  : "Record Voice Memo"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRecording
                  ? "Speak clearly into your microphone"
                  : "Click the microphone to start"}
              </p>
            </div>
          </div>

          {/* Audio Preview */}
          {(audioFile || recordedBlob) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileAudio className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">
                    {audioFile ? audioFile.name : "Voice Recording"}
                  </span>
                  {audioFile && (
                    <span className="text-sm text-muted-foreground">
                      ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  title="Remove audio"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <audio
                controls
                src={getAudioPreviewUrl() || undefined}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Transcribe Button */}
        <div
          className="flex justify-center mb-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            onClick={handleTranscribe}
            disabled={loading || (!audioFile && !recordedBlob)}
            className="btn-accent flex items-center gap-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Transcribe & Summarize
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {(transcription || summary) && (
          <div className="space-y-6 animate-fade-in">
            {/* Transcription Result */}
            {transcription && (
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    2. Transcription
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(transcription, "transcription")
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedField === "transcription" ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-foreground whitespace-pre-wrap">
                    {transcription}
                  </p>
                </div>
              </div>
            )}

            {/* Summary Result */}
            {summary && (
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    3. AI Summary
                  </h3>
                  <button
                    onClick={() => copyToClipboard(summary, "summary")}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedField === "summary" ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-foreground whitespace-pre-wrap prose prose-sm max-w-none">
                    {summary}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How It Works Section */}
        <div
          className="mt-12 card-elevated p-6 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-accent mt-0.5" />
            <h3 className="font-display text-lg font-bold text-foreground">
              How It Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-accent">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                Upload or Record
              </h4>
              <p className="text-sm text-muted-foreground">
                Upload a call recording or record a quick voice memo summarizing
                your call
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-accent">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                AI Transcription
              </h4>
              <p className="text-sm text-muted-foreground">
                OpenAI Whisper converts your audio to text with high accuracy
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-accent">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                Smart Summary
              </h4>
              <p className="text-sm text-muted-foreground">
                GPT-4 generates a structured summary with key points and action
                items
              </p>
            </div>
          </div>

          {/* Code Pattern Explanation */}
          <div className="mt-8 p-4 bg-primary/5 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Pattern Used</h4>
            <p className="text-sm text-muted-foreground mb-3">
              This demo uses the <strong>FormData + Two-Step AI</strong>{" "}
              pattern:
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                <strong>Frontend:</strong> Collects audio via file upload or
                MediaRecorder API
              </li>
              <li>
                <strong>API Route:</strong> Receives FormData with the audio
                file
              </li>
              <li>
                <strong>Whisper API:</strong> Transcribes audio to text
              </li>
              <li>
                <strong>Chat Completion:</strong> Summarizes the transcription
              </li>
              <li>
                <strong>Response:</strong> Returns both transcription and
                summary
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
