Create a reusable React component as specified by the user: $ARGUMENTS

Follow this pattern:

1. Create the file in `components/` (or `components/ui/` if it's a generic UI primitive)
2. Import React and `cn` from `@/lib/utils`
3. Define a simple props interface — only include props the component actually needs
4. Use `React.forwardRef` for form elements (inputs, buttons, textareas)
5. Apply Tailwind classes using the project's design system variables (e.g., `hsl(var(--primary))`)
6. Use the `cn()` utility to merge className props

Keep the component focused and simple:

- No complex state management
- No generics or advanced TypeScript patterns
- Use descriptive prop names
- Add a `displayName` if using `forwardRef`
- Use the existing CSS utility classes where possible: `card-elevated`, `input-enhanced`, `btn-primary`, `btn-accent`, `badge-accent`

The participant is a non-coder, so keep the code readable and well-structured.
