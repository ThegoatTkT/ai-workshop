# CLAUDE.md

## Project Overview

This is an **AI Workshop Template** — a starting point for building AI-powered sales tools during hands-on workshops. Participants (salespeople, not developers) use Claude Code to build apps by describing what they want in plain language.

### Workshop Use Cases

1. **Example App** (`/example`) — A complete working AI sales platform with:
   - **LeadGen Messaging** — Upload Excel data, AI generates personalized LinkedIn messages
   - **ICP Quiz** — Test ideal customer profile knowledge with AI-generated questions
   - **Audio Demo** — Transcribe and summarize sales calls with Whisper API
   - **Admin Panel** — Manage users, settings, cases, and recommendations

2. **Call Center Assistant** (`/call-assistant`) — Live support tool for call center operators:
   - Dialogue-based interface for customer interactions
   - AI generates helpful responses to customer queries
   - Asks clarifying questions when needed
   - References relevant cases and product information
   - Working scaffold with conversation history UI

3. **Post-Sales Assistant** (`/post-sales`) — Follow-up generation tool:
   - Text input for call notes or audio recording/upload
   - AI transcription with OpenAI Whisper
   - Generates CRM-ready meeting summaries
   - Extracts action items and next steps
   - Scaffold for participants to build upon

### Important Context for Claude

- **Participants are non-coders.** Explain everything in plain, jargon-free language.
- **Prefer complete files over diffs.** When making changes, show the entire file so participants can see the full picture.
- **Keep code simple.** No complex TypeScript generics, no advanced patterns. Use `useState`, basic functions, and clear variable names.
- **One step at a time.** Don't try to build everything at once. Guide participants through small, testable increments.
- **Be encouraging.** Celebrate progress and help troubleshoot errors without judgment.
- **Reference the example app.** Point to `/example` code when showing patterns.
- **Ask for React Grab snippets.** When the user describes a UI change or asks to modify a specific element, prompt them to copy the relevant snippet using React Grab (hover over the element and press Cmd+C or Ctrl+C) so you know exactly which component and file to edit.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system (see `globals.css`)
- **AI**: OpenAI SDK (`gpt-5-mini` for chat, `whisper-1` for audio)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Validation**: Zod (for structured AI outputs)
- **Icons**: Lucide React
- **Excel**: xlsx library for file parsing and export

## Project Structure

```
app/                              # Pages and API routes
  layout.tsx                      # Root layout (fonts, metadata)
  page.tsx                        # Landing page with links to all apps
  globals.css                     # Design system (colors, typography, components)

  example/                        # Complete working example app
    page.tsx                      # Dashboard with app cards
    login/page.tsx                # Authentication page
    leadgen/                      # LeadGen messaging feature
      page.tsx                    # Upload and job management
      jobs/[id]/page.tsx          # Job details
      jobs/[id]/results/page.tsx  # View generated messages
    icp-quiz/page.tsx             # ICP knowledge quiz
    audio-demo/page.tsx           # Audio transcription demo
    admin/                        # Admin panel
      layout.tsx                  # Admin layout with navigation
      users/page.tsx              # User management
      settings/page.tsx           # System settings
      cases/page.tsx              # Case study management
      recommendations/page.tsx   # AI recommendations config

  call-assistant/page.tsx         # Scaffold (participants build this)
  post-sales/page.tsx             # Scaffold (participants build this)

  api/
    chat/route.ts                 # Simple chat API example
    example/
      auth/                       # Authentication endpoints
        login/route.ts
        logout/route.ts
        me/route.ts
      leadgen/                    # LeadGen API routes
        jobs/route.ts             # Create/list jobs
        jobs/[id]/route.ts        # Job details
        jobs/[id]/results/route.ts
        jobs/[id]/export/route.ts
        jobs/[id]/cancel/route.ts
        records/[id]/route.ts
        records/[id]/regenerate/route.ts
        upload/route.ts
        template/route.ts
      icp-quiz/
        questions/route.ts
        submit/route.ts
      audio/route.ts              # Whisper transcription
      admin/                      # Admin API routes
        users/route.ts
        settings/route.ts
      cron/process/route.ts       # Background job processing

components/ui/                    # Reusable UI components
  button.tsx
  card.tsx
  input.tsx
  textarea.tsx

lib/
  openai.ts                       # Pre-configured OpenAI client
  utils.ts                        # Tailwind merge utility
  db/
    index.ts                      # Database connection
    schema.ts                     # Drizzle schema definitions
  auth/
    jwt.ts                        # JWT token utilities
    password.ts                   # Password hashing
    middleware.ts                 # Auth middleware for routes
  agents/
    config.ts                     # AI agent configuration
    processor.ts                  # Message generation processor
    case-matcher.ts               # Case study matching logic
    region-mapper.ts              # Region mapping utilities
  settings/
    index.ts                      # System settings management

scripts/
  migrate.ts                      # Database migration script
  cron-scheduler.js               # Background job scheduler

reference/                        # Advanced reference implementation
```

## GitHub Codespaces

This project is designed to run in **GitHub Codespaces** — a cloud development environment in the browser. Participants don't need to install anything locally.

### How Participants Get Started

1. Click "Use this template" → "Open in a codespace" on GitHub
2. Wait 1-2 minutes for the environment to set up
3. Copy `env.example` to `.env` and add their OpenAI API key
4. Install Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`
5. Run `npm run dev` to start the app

### Running Commands

All commands run in the VS Code terminal inside Codespaces:

```bash
npm run dev          # Start dev server (port 3000 auto-forwarded)
npm run build        # Build and type-check the project
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check without building
```

**Important for Claude:** When asked to check types, run builds, or execute any shell commands, these all run in the Codespaces terminal. Node.js 20 and all dependencies are pre-installed.

### What's Included

- Node.js 20 LTS
- SQLite tools (`sqlite3` command available)
- All npm dependencies (auto-installed on container creation)
- Database auto-migrated on first run
- Port 3000 automatically forwarded and opens in browser

### Important: Stop Codespace When Done

Participants get 60 free hours per month. Remind them to stop:

1. Press `Ctrl+Shift+P`
2. Type "stop"
3. Select "Codespaces: Stop Current Codespace"

## Commands

Run these in the VS Code integrated terminal (inside the dev container):

```bash
npm run dev          # Start dev server with background processing
npm run dev:next     # Start only Next.js (no background jobs)
npm run build        # Build for production
npm run lint         # Check for TypeScript/ESLint errors

npm run db:migrate   # Run database migrations
npm run db:generate  # Generate new migration files
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Required for all AI features
OPENAI_API_KEY=sk-your-key-here

# Database path (SQLite file location)
DATABASE_PATH=./data/workshop.db

# JWT secret for authentication (change in production)
JWT_SECRET=workshop-secret-change-in-production

# Background processing
CRON_SECRET=internal-cron-secret
API_URL=http://localhost:3000
```

## Slash Commands

These commands help participants build faster:

| Command               | What it does                                          |
| --------------------- | ----------------------------------------------------- |
| `/workshop-guide`     | Analyzes the project and suggests next steps          |
| `/scaffold-page`      | Creates a new page with the standard skeleton         |
| `/scaffold-api`       | Creates a new API route with error handling           |
| `/scaffold-component` | Creates a reusable UI component                       |
| `/add-openai`         | Wires up OpenAI to a page or API route                |
| `/debug-error`        | Diagnoses errors and explains fixes in plain language |
| `/check-app`          | Runs a health check (build, env, routes)              |
| `/deploy-check`       | Pre-deployment verification checklist                 |

## Patterns to Follow

### Pages

- Use `'use client'` at the top of interactive pages
- Import from `@/` (e.g., `import { openai } from '@/lib/openai'`)
- Use the design system classes: `card-elevated`, `input-enhanced`, `btn-primary`, `btn-accent`
- Use `font-display` class on headings

### API Routes

- Export `async function POST(request: Request)` from `route.ts`
- Always wrap in try/catch with proper error responses
- Parse body with `await request.json()` for JSON, `await request.formData()` for files
- Return with `NextResponse.json()`
- Use auth middleware for protected routes: `import { withAuth } from '@/lib/auth/middleware'`

### OpenAI Chat Completions

```typescript
import { openai } from "@/lib/openai";

const response = await openai.chat.completions.create({
  model: "gpt-5-mini-2025-08-07",
  messages: [
    { role: "system", content: "Your system prompt here" },
    { role: "user", content: userInput },
  ],
  temperature: 0.7,
});

const result = response.choices[0].message.content;
```

### OpenAI Audio Transcription (Whisper)

Use the shared audio utilities in `lib/audio/` for transcription and summarization:

```typescript
import { transcribeAudio, summarizeSalesCall } from "@/lib/audio";

// In an API route - receive audio file from FormData
const formData = await request.formData();
const audioFile = formData.get("audio") as File;

// Transcribe with Whisper
const transcription = await transcribeAudio(audioFile);

// Generate a structured summary
const summary = await summarizeSalesCall(transcription);
console.log(summary.keyPoints); // Array of key points
console.log(summary.actionItems); // Array of action items
console.log(summary.raw); // Full markdown summary
```

For scripts (e.g., batch processing), use the file path variant:

```typescript
import { transcribeAudioFromPath, summarizeSalesCall } from "@/lib/audio";

const transcription = await transcribeAudioFromPath(
  "./data/voice-sales-calls/call.ogg",
);
const summary = await summarizeSalesCall(transcription);
```

**Translation support** - translate transcriptions and summaries to any language:

```typescript
import { translateTranscription, translateSummary } from "@/lib/audio";

// Translate Russian transcription to English
const englishTranscript = await translateTranscription(transcription, "en");

// Translate summary to Spanish
const spanishSummary = await translateSummary(summary.raw, "es");
```

**Verify Whisper is working:**

```bash
npx tsx scripts/verify-whisper.ts
npx tsx scripts/verify-whisper.ts --translate en  # With English translation
```

### Database Queries (Drizzle)

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Select
const user = await db.select().from(users).where(eq(users.id, id));

// Insert
await db.insert(users).values({ username: "test", password: "hashed" });

// Update
await db.update(users).set({ role: "admin" }).where(eq(users.id, id));
```

## Example App Features

The `/example` section contains a complete, working AI sales platform. Study it to understand patterns:

### LeadGen Messaging

- Upload Excel files with prospect data
- AI researches prospects and matches relevant case studies
- Generates personalized 3-message LinkedIn sequences
- Export results back to Excel

### ICP Quiz

- 20 multiple-choice questions about ideal customer profiles
- Instant feedback and scoring
- Tests knowledge of decision-maker titles and targeting

### Audio Demo

- Upload audio files or record directly in browser
- Transcribe with OpenAI Whisper API
- Generate AI summaries with action items
- Copy results to paste into CRM

### Admin Panel (requires admin role)

- User management (create, edit, delete)
- System settings configuration
- Case study management
- AI recommendation settings

**Tell participants to study the example app first** before building their own. They can ask Claude Code to explain any part of it.

## Testing with Playwright

This project uses Playwright for automated testing and UI verification. **Use tests extensively when developing features.**

### When to Run Tests

- **After implementing a feature** — Verify it works end-to-end
- **After fixing a bug** — Confirm the fix and prevent regression
- **Before committing** — Run smoke tests to catch obvious issues
- **When validating UI changes** — Take screenshots for verification

### Test Commands

```bash
npm test                    # Run all tests (headless)
npm run test:headed         # Run tests with visible browser
npm run test:ui             # Open Playwright UI for debugging
npm run test:debug          # Debug mode with inspector
npm run test:report         # View HTML test report
npx playwright test <file>  # Run specific test file
```

### Test Structure

```
tests/
├── smoke.spec.ts           # Basic page load tests (run these first!)
├── fixtures/
│   └── auth.ts             # Authentication helper for protected pages
├── example/
│   ├── login.spec.ts       # Login flow tests
│   ├── leadgen.spec.ts     # LeadGen feature tests
│   ├── audio-demo.spec.ts  # Audio transcription tests
│   └── icp-quiz.spec.ts    # Quiz feature tests
├── api/
│   ├── auth.spec.ts        # Auth API endpoint tests
│   ├── chat.spec.ts        # Chat API tests
│   ├── leadgen.spec.ts     # LeadGen API tests
│   └── audio.spec.ts       # Audio API tests
└── screenshots/            # Captured screenshots for review
```

### Writing Tests

**Smoke test (verify page loads):**

```typescript
import { test, expect } from "@playwright/test";

test("page loads correctly", async ({ page }) => {
  await page.goto("/example");
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: "tests/screenshots/example.png" });
});
```

**Test with authentication (for protected pages):**

```typescript
import { test, expect } from "../fixtures/auth";

test("leadgen page works", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/example/leadgen");
  await expect(authenticatedPage.locator("text=Upload")).toBeVisible();
});
```

**API endpoint test:**

```typescript
import { test, expect } from "@playwright/test";

test("login API works", async ({ request }) => {
  const response = await request.post("/api/example/auth/login", {
    data: { username: "admin", password: "admin123" },
  });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.user.username).toBe("admin");
});
```

### Screenshot Verification

**IMPORTANT:** When implementing UI features, capture screenshots for verification. Claude can read these images to verify the UI looks correct.

```typescript
// Capture full page
await page.screenshot({
  path: "tests/screenshots/feature-name.png",
  fullPage: true,
});

// Capture specific element (cropped)
await page.locator(".card").screenshot({
  path: "tests/screenshots/card-component.png",
});

// Capture just the viewport
await page.screenshot({
  path: "tests/screenshots/viewport.png",
});
```

After running tests, use the Read tool to view screenshots:

```
Read tests/screenshots/feature-name.png
```

### Best Practices for Claude

1. **Run smoke tests before making changes** to ensure the app works
2. **Write a test when implementing a feature** to verify it works
3. **Take screenshots for UI changes** so you can visually verify them
4. **Run `npm test` after significant changes** to catch regressions
5. **Use the authenticated fixture** for testing protected pages
6. **Check test output for failures** before marking work complete

### Example: Testing a New Feature

When building a new feature, follow this pattern:

1. **Run smoke tests first** to ensure nothing is broken:

   ```bash
   npx playwright test smoke.spec.ts
   ```

2. **Implement the feature**

3. **Write a test for the feature**:

   ```typescript
   test("new feature works", async ({ page }) => {
     await page.goto("/my-feature");
     await page.fill('input[name="query"]', "test input");
     await page.click('button[type="submit"]');
     await expect(page.locator(".result")).toContainText("expected output");
     await page.screenshot({ path: "tests/screenshots/my-feature.png" });
   });
   ```

4. **Run the test**:

   ```bash
   npx playwright test tests/example/my-feature.spec.ts
   ```

5. **Review the screenshot** to verify UI:
   ```
   Read tests/screenshots/my-feature.png
   ```

## Workshop Flow

1. **Start with `/check-app`** to verify everything is set up
2. **Run `npm run db:migrate`** to initialize the database
3. **Study the Example App** at `/example` to understand patterns
4. **Use `/workshop-guide`** to get personalized next steps
5. **Build incrementally** — one feature at a time
6. **Test after each change** — run `npm test` to verify

See [WORKSHOP.md](./WORKSHOP.md) for detailed participant instructions and common prompts to try.

Instructions from: /home/user/repos/ai-workshop/CLAUDE.md
