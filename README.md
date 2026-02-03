# AI Sales Workshop

Build AI-powered sales tools with Claude Code — no coding experience needed.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/tensorninja/ai-workshop?quickstart=1)

## Quick Start (3 Steps)

### 1. Open in Codespaces

Click the green **"Open in GitHub Codespaces"** button above, or:

1. Click the green **"Use this template"** button at the top of this page
2. Select **"Open in a codespace"**
3. Wait 1-2 minutes for the environment to set up

### 2. Add Your OpenAI API Key

In the terminal at the bottom of VS Code:

```bash
cp env.example .env
```

Then open the `.env` file and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Install Claude Code

Run this command in the terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then type `claude` and press Enter to start Claude Code.

**You're ready to build!**

---

## What You'll Build

### Call Assistant (`/call-assistant`)

An AI tool that helps call center operators during customer calls:

- Enter customer information and queries
- Get AI-powered responses and clarifying questions
- Reference relevant cases and solutions
- Build a dialogue to resolve customer issues

### Post-Sales Assistant (`/post-sales`)

An AI tool that generates follow-up content after sales calls:

- Paste call notes or record audio
- Generate professional follow-up summaries
- Extract action items automatically
- Get CMS-ready formatted output

### Example App (`/example`)

A complete working AI sales platform to study and learn from:

- **LeadGen Messaging** — Generate personalized LinkedIn messages from Excel data
- **ICP Quiz** — Test ideal customer profile knowledge
- **Audio Demo** — Transcribe and summarize calls with AI
- **Admin Panel** — Manage users and settings

Login: `admin` / `admin123`

---

## How to Build

1. **Start the app**: Run `npm run dev` in the terminal
2. **Open the preview**: Click the "Ports" tab, then click the globe icon for port 3000
3. **Start Claude Code**: Type `claude` in a new terminal
4. **Describe what you want**: Tell Claude Code in plain English what to build

**Example prompt:**

> "Add a text input where I can type a customer question, and when I click submit, the AI responds with helpful information and asks a clarifying question."

---

## Important: Stop Your Codespace

GitHub Codespaces gives you **60 free hours per month**. Always stop your Codespace when you're done:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type `stop`
3. Select **"Codespaces: Stop Current Codespace"**

---

## Project Structure

```
app/
  call-assistant/     # Build your call assistant here
  post-sales/         # Build your post-sales tool here
  example/            # Complete working example (study this!)
  api/                # Backend API routes

lib/
  openai.ts           # Pre-configured OpenAI client
  db/                 # Database utilities
```

---

## Need Help?

- **Study the example app** at `/example` to see patterns
- **Ask Claude Code** to explain any code: "Explain how the audio transcription works"
- **Use slash commands** in Claude Code: `/workshop-guide`, `/debug-error`

See [WORKSHOP.md](./WORKSHOP.md) for detailed instructions and common prompts.
