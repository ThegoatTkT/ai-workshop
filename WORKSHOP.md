# Workshop Guide

Welcome to the AI Sales Workshop! You'll use Claude Code to build AI-powered sales tools — no coding experience required.

## Getting Started with GitHub Codespaces

### Step 1: Open Your Codespace

1. **Sign in to GitHub** at [github.com/login](https://github.com/login)
2. **Open the workshop repository**
3. Click the green **"Use this template"** button
4. Select **"Open in a codespace"**
5. Wait 1-2 minutes for the environment to set up

You'll see VS Code running in your browser with everything pre-installed.

### Step 2: Set Up Your API Key

In the terminal at the bottom of VS Code, run:

```bash
cp env.example .env
```

Then click on the `.env` file in the file explorer and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
```

Save the file (`Ctrl+S`).

### Step 3: Install Claude Code

Run this command in the terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

When installation completes, type `claude` and press Enter.

Follow the prompts to:

1. Choose a theme (Light mode works well in browsers)
2. Log in with your Claude account
3. Trust the project folder

### Step 4: Start the App

In a new terminal tab (`Ctrl+Shift+`), run:

```bash
npm run dev
```

Click the **"Ports"** tab at the bottom, then click the globe icon next to port 3000 to open your app in a new browser tab.

**You're ready to build!**

---

## What You're Building

### Use Case 1: Call Center Assistant

A tool that helps call center operators during customer calls.

**How it works:**

- Operator enters customer information and their question
- AI builds a dialogue with helpful responses
- AI asks clarifying questions when needed
- References relevant cases and solutions

**Build it at:** `/call-assistant`

**Example prompts to try with Claude Code:**

> "Make the call assistant work. When I type a customer question and click submit, the AI should respond helpfully and ask a clarifying question if needed."

> "Add a conversation history so I can see the full dialogue between the operator and the AI."

> "Make the AI reference relevant product information when answering questions."

### Use Case 2: Post-Sales Follow-up Assistant

A tool that generates follow-up content after sales calls.

**How it works:**

- Upload a recording or type call notes
- AI transcribes audio (if recorded)
- Generates a professional follow-up summary
- Extracts action items and next steps
- Formats output for CRM systems

**Build it at:** `/post-sales`

**Example prompts to try with Claude Code:**

> "Add a text area where I can paste my call notes, then generate a follow-up summary when I click submit."

> "Add audio recording like in the example app so I can record voice memos."

> "Format the output so it's ready to paste into a CRM system with sections for Summary, Action Items, and Next Steps."

---

## Study the Example App First

Before building, explore the complete example app at `/example`:

1. Go to `http://localhost:3000/example`
2. Log in with: `admin` / `admin123`
3. Try each feature:
   - **LeadGen** — See how forms and AI generation work
   - **Audio Demo** — See how audio transcription works
   - **ICP Quiz** — See how interactive features work

**Ask Claude Code to explain anything:**

> "Explain how the audio transcription works in the example app"

> "Show me how the LeadGen page sends data to the API"

---

## Building Step by Step

### The Basic Pattern

Every AI feature follows this pattern:

1. **Page** — A form where users enter information
2. **API Route** — Backend code that talks to OpenAI
3. **Display** — Shows the AI's response

### Your First Feature

Tell Claude Code what you want in plain English:

> "I want a text box where I type a customer question. When I click submit, it calls an API that uses OpenAI to generate a helpful response, then displays it on the page."

Claude Code will:

1. Add the text box and button to the page
2. Create an API route that calls OpenAI
3. Connect them together
4. Show the response

### Adding More Features

Once the basic feature works, add more:

> "Add a loading spinner while waiting for the AI response"

> "Remember the conversation history so we can have a back-and-forth dialogue"

> "Add a copy button so I can easily copy the response"

---

## Tips for Non-Coders

- **Be specific.** Instead of "make it better," say "add a section that shows action items as a bullet list."

- **Build one thing at a time.** Get one feature working before adding the next.

- **Test as you go.** After each change, check the browser to make sure it works.

- **Don't worry about breaking things.** Claude Code can always fix errors — just describe what went wrong.

- **Study the example first.** The `/example` pages show exactly how everything works.

- **Copy patterns.** When you want a feature, find something similar in the example app and ask Claude Code to do the same thing.

---

## Common Prompts

### For Call Assistant

```
"Add a text input for the customer question and a submit button"

"Create an API route that generates a helpful response using OpenAI"

"Display the AI response below the form"

"Add conversation history so we can see the full dialogue"

"Make the AI ask clarifying questions when the customer question is unclear"
```

### For Post-Sales Assistant

```
"Add a large text area for call notes"

"Generate a follow-up summary with action items"

"Add audio recording using the pattern from the example app"

"Format the output with sections: Summary, Action Items, Next Steps"

"Add a copy button for the generated content"
```

### General

```
"Explain how [feature] works in the example app"

"Fix this error: [paste error message]"

"Make this look nicer with better styling"

"Add error handling so users see a message if something goes wrong"
```

---

## Troubleshooting

### The page shows an error

Tell Claude Code: "Fix this error:" and paste the error message.

Or use the slash command: `/debug-error`

### The AI response is weird

Ask Claude Code to improve the prompt:

> "Make the AI response more professional and focused on customer service"

### Audio recording doesn't work

- Make sure you're on HTTPS (Codespaces provides this)
- Allow microphone access when the browser asks
- Try Chrome if other browsers don't work

### I'm stuck

- Type `/workshop-guide` in Claude Code for suggestions
- Study the example app for inspiration
- Ask Claude Code: "What should I build next?"

---

## Important: Stop Your Codespace!

GitHub Codespaces gives you **60 free hours per month**. The timer runs even when you're not actively using it!

**Always stop your Codespace when you're done:**

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type `stop`
3. Select **"Codespaces: Stop Current Codespace"**

You can restart it anytime from [github.com/codespaces](https://github.com/codespaces).

---

## VS Code Shortcuts

| Action          | Shortcut           |
| --------------- | ------------------ |
| Open terminal   | `Ctrl + ``         |
| Open file       | `Ctrl + P`         |
| Save file       | `Ctrl + S`         |
| Command palette | `Ctrl + Shift + P` |
| Search in files | `Ctrl + Shift + F` |

---

## Example Login

For the example app at `/example`:

- **Username:** `admin`
- **Password:** `admin123`
