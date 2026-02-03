Create a new Next.js page at the route specified by the user: $ARGUMENTS

Follow this exact pattern:

1. Create a file at `app/<route>/page.tsx`
2. Use `'use client'` at the top
3. Import `useState` from React and `Link` from `next/link`
4. Import `ArrowLeft` from `lucide-react`
5. Include a back link to the parent route
6. Add a heading and description
7. Include commented-out skeleton code showing:
   - State variables (`input`, `result`, `loading`)
   - A `handleSubmit` async function that calls a fetch POST
   - A form with textarea, submit button, and result display area

Use the existing design system classes: `input-enhanced` for inputs, `btn-primary` for buttons, `card-elevated` for containers. Use `font-display` class on headings.

Keep the code simple — no TypeScript generics, no complex types. This is for non-coders learning to build with AI.
