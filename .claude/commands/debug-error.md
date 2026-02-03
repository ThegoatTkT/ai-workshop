The participant is seeing an error. Help them fix it.

Error or problem description: $ARGUMENTS

Diagnostic steps:

1. Check if `.env` or `.env.local` exists and has `OPENAI_API_KEY` (many errors come from missing API keys)
2. Check `package.json` to see if all needed dependencies are installed
3. Look at the file mentioned in the error for syntax issues
4. Run `npm run lint` to check for TypeScript errors
5. Check the terminal output for more context

When explaining the fix:

- Use plain, non-technical language
- Explain WHY the error happened, not just how to fix it
- Show the exact file and line that needs to change
- If it's an environment issue, give step-by-step instructions
- If it's a code issue, show the corrected code as a complete file (not a diff)

Common issues in this workshop:

- Missing `OPENAI_API_KEY` in `.env` → "The app can't find your OpenAI key"
- Import path wrong → "The file is trying to find something that doesn't exist at that location"
- Missing `'use client'` → "React needs to know this page runs in the browser"
- JSON parse error in API route → "The data sent to the API isn't in the right format"
- CORS or fetch error → "The page is trying to talk to the API but something went wrong with the connection"
