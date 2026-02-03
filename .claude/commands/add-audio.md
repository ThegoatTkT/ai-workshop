Help the participant add audio transcription, summarization, and translation to their app.

The user wants: $ARGUMENTS

## Step 1: Understand What They Need

Ask what features they want (if not clear from their request):

1. **Just transcription** — Convert audio to text
2. **Transcription + summarization** — Also generate key points, action items, next steps
3. **Full pipeline with translation** — All of the above, plus translate to another language

## Step 2: Use the Shared Audio Utilities

All audio features are available in `lib/audio/`. These utilities handle all the complexity:

```typescript
import {
  transcribeAudio, // Transcribe audio file with Whisper
  transcribeAudioFromPath, // Transcribe from file path (for scripts)
  summarizeSalesCall, // Generate structured summary
  translateTranscription, // Translate transcription to any language
  translateSummary, // Translate summary to any language
  type SalesSummary, // TypeScript type for summary
} from "@/lib/audio";
```

## Step 3: Create or Update the API Route

For a page that processes audio, create an API route like this:

```typescript
import { NextResponse } from "next/server";
import { transcribeAudio, summarizeSalesCall } from "@/lib/audio";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file required" },
        { status: 400 },
      );
    }

    const transcription = await transcribeAudio(audioFile);
    const summary = await summarizeSalesCall(transcription);

    return NextResponse.json({
      transcription,
      summary: summary.raw,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems,
      nextSteps: summary.nextSteps,
    });
  } catch (error) {
    console.error("Audio error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

## Step 4: Add Translation (Optional)

If they want translation, add a language parameter:

```typescript
import { translateTranscription, translateSummary } from "@/lib/audio";

// Get target language from request
const translateTo = formData.get("translateTo") as string;

// Translate if requested
if (translateTo) {
  const translatedText = await translateTranscription(
    transcription,
    translateTo,
  );
  const translatedSummary = await translateSummary(summary.raw, translateTo);
}
```

Supported languages: en, es, fr, de, it, pt, ru, zh, ja, ko, ar, hi, nl, pl, tr, uk, vi, th, id, cs, ro, hu, el, sv, da, fi, no, he

## Step 5: Connect the Frontend

Help them add:

1. File upload (drag & drop or file picker)
2. Record button (using MediaRecorder API)
3. Language selector dropdown (if translation needed)
4. Results display with copy buttons

## Reference Example

Point the participant to the complete working example:

- **Page**: `/audio-example` — Full UI with upload, recording, translation
- **API**: `/api/audio-example/route.ts` — Complete backend with all features
- **Utilities**: `lib/audio/` — Shared functions they can use directly

## Common Prompts to Suggest

If the participant is stuck, suggest these prompts:

- "Add audio file upload to my page with drag and drop"
- "Add a record button that captures audio from the microphone"
- "Add a language dropdown with English, Spanish, French, and German options"
- "Display the transcription and summary results with copy buttons"
- "Make it work like the /audio-example page"

## Verification

After implementation, they can test with:

```bash
npx tsx scripts/verify-whisper.ts              # Basic test
npx tsx scripts/verify-whisper.ts --translate en  # With translation
```

Remember: Keep explanations simple. These participants are not developers.
