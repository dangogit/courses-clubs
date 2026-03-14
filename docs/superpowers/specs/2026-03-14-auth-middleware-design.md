# Auth Middleware Design

**Issue:** #4 — Implement auth middleware — protect all routes
**Date:** 2026-03-14

## Overview

Add Next.js middleware that refreshes Supabase auth sessions on every request and redirects unauthenticated users away from protected routes.

## Files

### `src/lib/supabase/middleware.ts` — Session refresh + route protection

- Creates a Supabase server client using `@supabase/ssr`'s `createServerClient`
- Reads/writes cookies via `request.headers` and `NextResponse` (the middleware cookie pattern — different from the server.ts pattern that uses `next/headers`)
- Calls `supabase.auth.getUser()` to validate and refresh the session
- If no user AND route is protected → `NextResponse.redirect` to `/login?next=<path>`
- Returns response with updated session cookies

**Public routes** (no redirect):
- `/` — landing page
- `/login` — sign-in page
- `/auth/callback` — OAuth/magic-link callback

### `middleware.ts` (repo root) — Thin wrapper

- Imports and calls `updateSession(request)`
- Exports `config.matcher` excluding: `_next/static`, `_next/image`, `favicon.ico`, `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`

## Redirect Flow

```
/courses (unauthed) → /login?next=/courses → auth → callback → /courses
```

The `next` query param is already supported by the login page and auth callback.

## Tests

Unit tests in `src/lib/supabase/__tests__/middleware.test.ts`:
- Unauthenticated request to protected route → redirects to `/login?next=<path>`
- Authenticated request → passes through with refreshed cookies
- Public routes (`/`, `/login`, `/auth/callback`) → no redirect regardless of auth
- Matcher excludes static assets

## Dependencies

- `@supabase/ssr` (already installed, v0.9.0)
- `@supabase/supabase-js` (already installed, v2.99.1)
- `next/server` (NextRequest, NextResponse)
