"use client";

/**
 * Audio Transcription & Translation Example
 *
 * This is a complete, working example demonstrating all the audio utilities:
 * - Transcription with OpenAI Whisper
 * - Summarization with GPT-5
 * - Translation to 28+ languages
 *
 * Participants can use this for the actual workshop use case and
 * reference the code patterns for their own implementations.
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
  Languages,
  Trash2,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react";

// Supported languages for translation
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "he", name: "Hebrew" },
];

// Claude Code prompts for participants
const PROMPTS = [
  {
    title: "Add audio transcription",
    prompt:
      "Add audio upload and transcription to my page using the utilities from lib/audio",
  },
  {
    title: "Add summarization",
    prompt:
      "After transcribing, generate a sales call summary with key points and action items",
  },
  {
    title: "Add translation",
    prompt:
      "Add a language selector and translate the transcription and summary to the selected language",
  },
  {
    title: "Add microphone recording",
    prompt:
      "Add a record button that captures audio from the microphone and sends it for transcription",
  },
  {
    title: "Customize the summary format",
    prompt:
      "Change the summary to include a follow-up email draft and meeting notes format",
  },
];

// API response type
interface ProcessingResult {
  transcription: string;
  translatedTranscription: string | null;
  summary: {
    raw: string;
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    nextSteps: string[];
  };
  translatedSummary: string | null;
  metadata: {
    audioFileName: string;
    audioSize: number;
    translateTo: string | null;
    processingTimeMs: number;
  };
}

export default function AudioExamplePage() {
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Translation state
  const [enableTranslation, setEnableTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");

  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showStructured, setShowStructured] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setError("Please select an audio file (MP3, WAV, M4A, OGG, WebM)");
      return;
    }
    setAudioFile(file);
    setRecordedBlob(null);
    setResult(null);
    setError("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  // ============================================
  // RECORDING HANDLERS
  // ============================================

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedBlob(audioBlob);
        setAudioFile(null);
        setResult(null);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      console.error("Microphone error:", err);
      setError(
        "Could not access microphone. Please check browser permissions.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ============================================
  // PROCESSING HANDLER
  // ============================================

  const handleProcess = async () => {
    const audioToSend = audioFile || recordedBlob;
    if (!audioToSend) {
      setError("Please upload or record audio first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      if (audioFile) {
        formData.append("audio", audioFile);
      } else if (recordedBlob) {
        const file = new File([recordedBlob], "recording.webm", {
          type: "audio/webm",
        });
        formData.append("audio", file);
      }

      if (enableTranslation && targetLanguage) {
        formData.append("translateTo", targetLanguage);
      }

      const response = await fetch("/api/audio-example", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process audio");
      }

      const data: ProcessingResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process audio");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setToast("Prompt copied to clipboard!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const clearAll = () => {
    setAudioFile(null);
    setRecordedBlob(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getAudioPreviewUrl = () => {
    if (audioFile) return URL.createObjectURL(audioFile);
    if (recordedBlob) return URL.createObjectURL(recordedBlob);
    return null;
  };

  const getSelectedLanguageName = () => {
    return (
      LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">
                  Audio Transcription & Translation
                </h1>
                <p className="text-sm text-muted-foreground">
                  Complete example with Whisper, GPT-5, and multi-language
                  support
                </p>
              </div>
            </div>
            <Link
              href="/"
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
            <span className="text-gradient">
              Full-Featured Audio Processing
            </span>
          </h2>
          <p className="text-muted-foreground">
            Upload or record audio, get instant transcription and AI summaries,
            then translate to any of 28 supported languages. Uses the shared
            utilities from{" "}
            <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
              lib/audio/
            </code>
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
                MP3, WAV, M4A, OGG, WebM
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

        {/* Translation Options */}
        <div
          className="card-elevated p-6 mb-6 animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Languages className="w-5 h-5 text-accent" />
            2. Translation Options
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Enable Translation Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTranslation}
                onChange={(e) => setEnableTranslation(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
              />
              <span className="font-medium text-foreground">
                Translate results
              </span>
            </label>

            {/* Language Selector */}
            {enableTranslation && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm text-muted-foreground">to</span>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="input-enhanced py-2 px-3 pr-8 cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {enableTranslation && (
            <p className="text-sm text-muted-foreground mt-3">
              Both transcription and summary will be translated to{" "}
              {getSelectedLanguageName()}.
            </p>
          )}
        </div>

        {/* Process Button */}
        <div
          className="flex justify-center mb-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            onClick={handleProcess}
            disabled={loading || (!audioFile && !recordedBlob)}
            className="btn-accent flex items-center gap-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing{enableTranslation ? " & Translating" : ""}...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Transcribe & Summarize{enableTranslation ? " & Translate" : ""}
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Processing Time */}
            <div className="text-center text-sm text-muted-foreground">
              Processed in{" "}
              {(result.metadata.processingTimeMs / 1000).toFixed(2)} seconds
            </div>

            {/* Transcription */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-foreground">
                  3. Transcription{" "}
                  {result.translatedTranscription && "(Original)"}
                </h3>
                <button
                  onClick={() =>
                    copyToClipboard(result.transcription, "transcription")
                  }
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {copiedField === "transcription" ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
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
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-foreground whitespace-pre-wrap">
                  {result.transcription}
                </p>
              </div>
            </div>

            {/* Translated Transcription */}
            {result.translatedTranscription && (
              <div className="card-elevated p-6 border-l-4 border-accent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Languages className="w-5 h-5 text-accent" />
                    Transcription ({getSelectedLanguageName()})
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        result.translatedTranscription!,
                        "translatedTranscription",
                      )
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedField === "translatedTranscription" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
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
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-foreground whitespace-pre-wrap">
                    {result.translatedTranscription}
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-foreground">
                  4. AI Summary {result.translatedSummary && "(Original)"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowStructured(!showStructured)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {showStructured ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Raw
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Structured
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(result.summary.raw, "summary")
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedField === "summary" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
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
              </div>

              {showStructured ? (
                <div className="space-y-4">
                  {/* Summary Overview */}
                  {result.summary.summary && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        Summary
                      </h4>
                      <p className="text-muted-foreground">
                        {result.summary.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {result.summary.keyPoints.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        Key Points ({result.summary.keyPoints.length})
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.summary.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {result.summary.actionItems.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        Action Items ({result.summary.actionItems.length})
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.summary.actionItems.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.summary.nextSteps.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        Next Steps ({result.summary.nextSteps.length})
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.summary.nextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-foreground whitespace-pre-wrap prose prose-sm max-w-none">
                    {result.summary.raw}
                  </div>
                </div>
              )}
            </div>

            {/* Translated Summary */}
            {result.translatedSummary && (
              <div className="card-elevated p-6 border-l-4 border-accent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Languages className="w-5 h-5 text-accent" />
                    Summary ({getSelectedLanguageName()})
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        result.translatedSummary!,
                        "translatedSummary",
                      )
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedField === "translatedSummary" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
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
                    {result.translatedSummary}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How to Build Your Own Section */}
        <div
          className="mt-12 card-elevated p-6 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-4">
            Build Your Own with Claude Code
          </h3>

          <p className="text-muted-foreground mb-4">
            Click any prompt below to copy it, then paste into Claude Code:
          </p>

          <div className="space-y-3">
            {PROMPTS.map((item, index) => (
              <button
                key={index}
                onClick={() => copyPrompt(item.prompt)}
                className="w-full text-left p-4 bg-gray-50 rounded-lg border-l-4 border-accent hover:bg-accent/10 hover:border-accent transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {item.title}:
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{item.prompt}&quot;
                    </p>
                  </div>
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Point Claude Code to this page as a
              reference:{" "}
              <span className="italic">
                &quot;Make it work like the /audio-example page&quot;
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg shadow-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
