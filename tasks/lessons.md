# Lessons Learned

Patterns and mistakes to avoid, updated after each correction.

## Supabase
- `supabase gen types` stderr leaks into stdout — always clean the output file
- Migration timestamps must be real — use `supabase migration new`
- Unmerged feature branch migrations CAN be edited in-place
- RLS must cover all 4 operations per table

## Next.js
- Middleware MUST be at `src/middleware.ts` when using `src/` directory
- `useSearchParams` requires `<Suspense>` boundary in parent page

## Testing
- Always run E2E tests, not just unit tests
- Playwright: `.unauth.spec.ts` needs `testIgnore` in chromium project config

## Workflow
- Move issue to Review (not Done) after creating PR — Done is only after merge
