"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Mic,
  Mail,
  CheckSquare,
  ListTodo,
} from "lucide-react";

// =============================================================================
// POST-SALES ASSISTANT - Follow-up Generation Tool
// =============================================================================
// This tool helps generate follow-up content after sales calls.
// Users can type call notes or record audio, and get AI-generated:
// - Meeting summaries in CRM-ready format
// - Action items with owners
// - Next steps and follow-up recommendations
//
// KEY FEATURES TO BUILD:
// - Text input for call notes
// - Audio recording/upload with transcription
// - CRM-ready output format (paste directly into your CRM)
//
// For audio patterns, see: /example/audio-demo
// =============================================================================

export default function PostSales() {
  // ===========================================================================
  // TODO: Add state for inputs and outputs
  // ===========================================================================
  // const [callNotes, setCallNotes] = useState('')
  // const [result, setResult] = useState('')
  // const [loading, setLoading] = useState(false)

  // ===========================================================================
  // TODO: Add state for audio recording (optional advanced feature)
  // ===========================================================================
  // const [audioFile, setAudioFile] = useState<File | null>(null)
  // const [isRecording, setIsRecording] = useState(false)
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  // const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  // ===========================================================================
  // TODO: Create a submit handler for text notes
  // ===========================================================================
  // async function handleSubmit() {
  //   setLoading(true)
  //   try {
  //     const response = await fetch('/api/post-sales', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ callNotes })
  //     })
  //     const data = await response.json()
  //     setResult(data.result)
  //   } catch (error) {
  //     console.error('Error:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // ===========================================================================
  // TODO: For audio recording, use the MediaRecorder API
  // ===========================================================================
  // async function startRecording() {
  //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  //   const recorder = new MediaRecorder(stream)
  //   const chunks: Blob[] = []
  //
  //   recorder.ondataavailable = (e) => {
  //     if (e.data.size > 0) chunks.push(e.data)
  //   }
  //
  //   recorder.onstop = () => {
  //     const audioBlob = new Blob(chunks, { type: 'audio/webm' })
  //     const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
  //     setAudioFile(file)
  //   }
  //
  //   recorder.start()
  //   setMediaRecorder(recorder)
  //   setIsRecording(true)
  // }
  //
  // function stopRecording() {
  //   mediaRecorder?.stop()
  //   setIsRecording(false)
  // }

  // ===========================================================================
  // TODO: For audio transcription, send to an API route that uses Whisper
  // ===========================================================================
  // In your API route (e.g., /api/post-sales/transcribe):
  //
  // import { openai } from '@/lib/openai'
  //
  // const transcription = await openai.audio.transcriptions.create({
  //   file: audioFile,
  //   model: 'whisper-1',
  // })
  //
  // Then use the transcription.text with chat completion to generate:
  // - Follow-up email
  // - Meeting summary
  // - Action items
  // - Next steps

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 font-display flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Post-Sales Assistant
        </h1>
        <p className="text-muted-foreground text-lg">
          Build an AI tool that generates follow-up content from call notes or
          recordings.
        </p>
      </div>

      {/* What to Build Section */}
      <div className="card-elevated p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 font-display">
          What to Build
        </h2>
        <p className="text-muted-foreground mb-4">
          Create a post-call assistant that takes meeting notes (typed or
          recorded) and generates CRM-ready follow-up content:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Meeting Summary</p>
              <p className="text-sm text-muted-foreground">
                Key points in CRM-ready format
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <CheckSquare className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Action Items</p>
              <p className="text-sm text-muted-foreground">
                Tasks with owners and dates
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <ListTodo className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Next Steps</p>
              <p className="text-sm text-muted-foreground">
                Recommended follow-up actions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Follow-up Email</p>
              <p className="text-sm text-muted-foreground">
                Optional email draft
              </p>
            </div>
          </div>
        </div>

        {/* Audio Feature Callout */}
        <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium text-accent">
                Advanced: Audio Recording
              </p>
              <p className="text-sm text-muted-foreground">
                You can add audio recording using the MediaRecorder API, then
                transcribe with OpenAI Whisper. See the code comments for
                patterns!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Start Section */}
      <div className="card-elevated p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 font-display">
          How to Start
        </h2>
        <p className="text-muted-foreground mb-4">
          Try these prompts with Claude Code to build your assistant step by
          step:
        </p>

        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Basic (Text Input):
          </p>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                1
              </span>
              <span>
                &quot;Add a large text area for call notes with a submit
                button&quot;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                2
              </span>
              <span>
                &quot;Create an API route at /api/post-sales that generates a
                CRM-ready summary with action items&quot;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                3
              </span>
              <span>
                &quot;Display the results in nicely formatted sections&quot;
              </span>
            </li>
          </ol>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Advanced (Audio):
          </p>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white text-sm flex items-center justify-center font-medium">
                4
              </span>
              <span>
                &quot;Add a record button that captures audio using
                MediaRecorder&quot;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white text-sm flex items-center justify-center font-medium">
                5
              </span>
              <span>
                &quot;Create an API route that transcribes audio with OpenAI
                Whisper&quot;
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">
            <strong>Tip:</strong> Start with text input first, then add audio as
            an enhancement! Study the{" "}
            <Link
              href="/example"
              className="text-primary underline cursor-pointer"
            >
              Example App
            </Link>{" "}
            for basic patterns.
          </p>
        </div>
      </div>

      {/* Build Area - This is where participants will add their UI */}
      <div className="card-elevated p-6">
        <h2 className="text-xl font-semibold mb-4 font-display">Your App</h2>

        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground mb-2">
            Your post-sales assistant will appear here.
          </p>
          <p className="text-sm text-muted-foreground">
            Ask Claude Code to help you build it!
          </p>
        </div>

        {/* ==================================================================
            TODO: Replace the placeholder above with your form and results
            ==================================================================
            Example structure for text input:
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Call Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Paste or type your call notes here...

Example:
- Met with John Smith, VP of Sales at Acme Corp
- Discussed their current CRM challenges
- They're interested in our automation features
- Budget approved for Q2
- Need to send pricing proposal by Friday"
                  className="input-enhanced"
                  rows={8}
                />
              </div>
              
              <button 
                onClick={handleSubmit} 
                disabled={loading || !callNotes.trim()}
                className="btn-primary w-full"
              >
                {loading ? 'Generating...' : 'Generate Follow-up'}
              </button>
            </div>
            
            {result && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Follow-up Email
                  </h3>
                  <div className="whitespace-pre-wrap text-sm">{result.email}</div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Action Items
                  </h3>
                  <div className="whitespace-pre-wrap text-sm">{result.actionItems}</div>
                </div>
              </div>
            )}
            
            ==================================================================
            Example structure for audio recording:
            
            <div className="flex gap-2 mb-4">
              {!isRecording ? (
                <button onClick={startRecording} className="btn-accent flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Start Recording
                </button>
              ) : (
                <button onClick={stopRecording} className="btn-primary flex items-center gap-2 animate-pulse">
                  <Mic className="w-4 h-4" />
                  Stop Recording
                </button>
              )}
              
              {audioFile && (
                <span className="text-sm text-muted-foreground self-center">
                  Recording saved: {audioFile.name}
                </span>
              )}
            </div>
        ================================================================== */}
      </div>
    </main>
  );
}
