Run a health check on the workshop project and report the status.

Steps:

1. Check if `.env` or `.env.local` exists and has `OPENAI_API_KEY`
2. Check if database exists at `./data/workshop.db`
3. Run `npm run build` and capture the output
4. List all pages by checking directories under `app/` (exclude `api/`)
5. List all API routes by checking directories under `app/api/`
6. Check if `node_modules` exists (if not, suggest `npm install`)
7. Check for any TypeScript errors in the build output

Report the results in a clear format:

**Environment**

- OPENAI_API_KEY: Set / Not set

**Database**

- workshop.db: Found / Not found (suggest running `npm run db:migrate`)

**Pages**

- / (landing page)
- /example (main example — chat completion & structured output)
- /audio-example (full-featured audio — transcription, summarization, translation)
- /example/audio-demo (simpler audio transcription example)
- /call-assistant (scaffold)
- /post-sales (scaffold)
- (any others found)

**API Routes**

- /api/chat (basic chat endpoint)
- /api/example/route.ts (example endpoint)
- /api/example/audio/route.ts (audio transcription endpoint)
- (any others found)

**Build Status**

- Pass / Fail (with error details if failed)

If there are problems, explain each one in plain language and suggest how to fix it.

Common fixes:

- Missing OPENAI_API_KEY: Copy `.env.example` to `.env` and add your key
- Missing database: Run `npm run db:migrate` to create the database
- Missing node_modules: Run `npm install`
