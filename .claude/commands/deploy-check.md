Run pre-deployment checks to make sure the app is ready to ship.

Checks to perform:

1. **No hardcoded secrets**: Search all `.ts` and `.tsx` files for patterns like `sk-`, API keys, or hardcoded credentials. Report any found.

2. **Environment variables**: Check that all `process.env.*` references have corresponding entries in `.env.example`. Make sure `.env` is in `.gitignore`.

3. **Lint check**: Run `npm run lint` and report results.

4. **Build check**: Run `npm run build` and report results.

5. **Missing error handling**: Check API routes for try/catch blocks. Flag any routes without error handling.

6. **Console.log cleanup**: Search for `console.log` in production code (not in API error handlers where it's fine). Suggest removing debug logs.

Report results as a checklist:

- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] .env in .gitignore
- [ ] Lint passes
- [ ] Build succeeds
- [ ] API routes have error handling
- [ ] No debug console.logs

For any failing checks, explain the issue in plain language and suggest the fix.
