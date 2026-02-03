Help the participant add OpenAI functionality to their app. The user wants: $ARGUMENTS

Follow these steps:

1. Check if `lib/openai.ts` exists (it should — it's the pre-configured client)
2. Check if `.env` or `.env.local` has `OPENAI_API_KEY` set. If not, tell the participant they need to add it.
3. Determine what the participant wants:
   - **Chat completion**: Use `openai.chat.completions.create()` with a system prompt and user message
   - **Structured output**: Use `openai.chat.completions.create()` with a Zod schema via `response_format`
   - **Audio transcription**: Use `openai.audio.transcriptions.create()` with Whisper

4. If they need an API route, create one following the pattern in `app/api/chat/route.ts`
5. If they need to connect a page to an API route, add the fetch call with proper loading state
6. If they want structured output, add a Zod schema and use it with OpenAI's `response_format`

Important guidelines:

- Use `gpt-5-mini-2025-08-07` as the default model (fast and cheap)
- Always include error handling in API routes
- Write clear system prompts that explain the AI's role
- Keep the code simple — avoid complex TypeScript
- Explain what each part does in comments

Example system prompts for sales tools:

- Call prep: "You are a sales call preparation assistant. Given information about a prospect, generate talking points, potential objections, and recommended approaches."
- Follow-up: "You are a post-sales assistant. Given call notes, generate a professional follow-up email and list of action items."
- Meeting summary: "You are a meeting summarizer. Given raw notes from a sales call, create a structured summary with key decisions, action items, and next steps."

## Audio Transcription Pattern

For audio features, use the shared utilities in `lib/audio/` which handle all the complexity:

```typescript
import {
  transcribeAudio,
  summarizeSalesCall,
  translateTranscription,
  translateSummary,
} from "@/lib/audio";

// In your API route:
const transcription = await transcribeAudio(audioFile);
const summary = await summarizeSalesCall(transcription);

// Optional: translate to any language
const englishTranscript = await translateTranscription(transcription, "en");
const englishSummary = await translateSummary(summary.raw, "en");
```

**Available utilities:**

- `transcribeAudio(file)` — Transcribe audio with Whisper
- `transcribeAudioFromPath(path)` — Transcribe from file path (for scripts)
- `summarizeSalesCall(text)` — Generate structured summary with key points, action items, next steps
- `translateTranscription(text, lang)` — Translate transcription to any of 28 languages
- `translateSummary(text, lang)` — Translate summary to any language

For a complete working example with UI, see `/audio-example` and `/api/audio-example/route.ts`

Use the `/add-audio` command for step-by-step guidance on adding audio features.
