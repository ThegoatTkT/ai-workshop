Create a new Next.js API route at the path specified by the user: $ARGUMENTS

Follow this exact pattern:

1. Create a file at `app/api/<path>/route.ts`
2. Import `NextResponse` from `next/server`
3. If the user wants OpenAI integration, import `{ openai }` from `@/lib/openai`
4. Export an `async function POST(request: Request)` handler
5. Wrap the body in try/catch
6. Parse the request body with `await request.json()`
7. Validate required fields, return 400 if missing
8. If using OpenAI, call `openai.chat.completions.create()` with `gpt-5-mini-2025-08-07` model
9. Return the result with `NextResponse.json()`
10. In the catch block, log the error and return a 500 response

Keep it simple. Use clear variable names. Add a brief comment explaining what the endpoint does. No TypeScript generics — just basic types.

## Standard API Route Example

```typescript
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }
    // Your OpenAI call here
    return NextResponse.json({ result: "..." });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
```

## Audio Transcription Route Example

For audio endpoints, use the shared utilities from `lib/audio/`:

```typescript
import { NextResponse } from "next/server";
import { transcribeAudio, summarizeSalesCall } from "@/lib/audio";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    // Transcribe with Whisper
    const transcription = await transcribeAudio(audioFile);

    // Generate summary with key points, action items, next steps
    const summary = await summarizeSalesCall(transcription);

    return NextResponse.json({
      transcription,
      summary: summary.raw,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems,
    });
  } catch (error) {
    console.error("Audio processing error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
```

For a complete working example with translation support, see `/api/audio-example/route.ts`

Use the `/add-audio` command for step-by-step guidance on adding audio features.
