---
description: Push commits to remote with safety checks
---

Push local commits to the remote repository with pre-push safety checks.

## Instructions

1. Run `git status` to check current branch state
2. Run `git log origin/HEAD..HEAD --oneline` to see unpushed commits
3. Verify you are NOT on main/master branch (warn if so)
4. Check if remote branch exists:
   - If exists: `git push`
   - If new branch: `git push -u origin HEAD`

## Safety Checks

Before pushing, verify:

- [ ] Branch is not main/master (require explicit confirmation)
- [ ] No uncommitted changes that should be included
- [ ] Branch is not behind remote (may need pull first)

## Common Scenarios

### New feature branch

```bash
git push -u origin HEAD
```

### Existing tracked branch

```bash
git push
```

### Force push (DANGEROUS - requires explicit user request)

Only if user explicitly requests:

```bash
git push --force-with-lease
```

## Related

- `/git-commit` - Create a commit with proper message
- `/git-commit-feature` - Create a commit for larger features

## Notes

- Never force push to main/master
- Use `--force-with-lease` instead of `--force` when force pushing
- Always check for unpushed commits first
