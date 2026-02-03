---
description: Analyze staged files and create a commit
---

Analyze all staged files and create a comprehensive commit message.

## Instructions

1. Run `git status` to see all staged files
2. Run `git diff --cached` to see the actual changes
3. Run `git log --oneline -5` to see recent commit message style

4. Analyze the changes:
   - Determine the type: feat, fix, refactor, docs, test, chore, etc.
   - Identify the scope (component/module affected)
   - Summarize the "why" not just the "what"

5. Create a commit message following the project convention:

   ```
   type(scope): short description

   Optional body explaining why the change was made.
   ```

6. Execute the commit with `git commit -m "..."`

## Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvement
- `style`: Formatting, missing semicolons, etc.

## Notes

- Keep the first line under 72 characters
- Use imperative mood ("add" not "added")
- Reference issues if applicable
