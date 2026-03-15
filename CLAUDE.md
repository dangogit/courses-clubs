# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, v9)
npm test             # Run all unit tests (Vitest)
npm run test:watch   # Watch mode during development
npx playwright test  # Run E2E tests (starts dev server on :3100)
```

## Testing

**Unit tests:** Vitest + React Testing Library + jsdom

**Convention:** Every new function, hook, or component gets a test file at `__tests__/<name>.test.ts(x)` co-located next to the source.

**Test-first for logic:** Write tests before implementation for pure functions (data utils, validators, transformers). Write tests alongside for UI components.

**E2E tests:** Playwright (`e2e/` directory, `playwright.config.ts`)
- Auth setup in `e2e/auth.setup.ts`, stored state in `e2e/.auth/user.json`
- Authenticated specs: `*.spec.ts` (run under `chromium` project with stored auth)
- Unauthenticated specs: `*.unauth.spec.ts` (run under `unauthenticated` project, no auth)
- Dev server on port 3100 for E2E: `npx playwright test`
- Always add E2E tests for new Supabase-backed features — unit tests with mocked Supabase don't catch real integration issues

**Integration tests:** When adding RLS policies or RPCs, add integration tests that hit the local Supabase instance (port 55122) to verify access control.

## What This Is

A **forked community platform template** for AI education clubs. One repo = one club, deployed per tenant. Currently: Brainers Club (Hebrew AI community).

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui (Base UI) + TanStack React Query v5

**Phase 1 (done):** Supabase auth (Google OAuth + Magic Link), route protection middleware, profile creation on first sign-in.
**Phase 2 (in progress):** Supabase database — courses/lessons/progress wired to Supabase. Other data (recordings, events, groups, agents) still uses mock arrays in `src/data/`.
**Phase 3+ (planned):** Remaining tables, Bunny.net video CDN, payments.

## Architecture

### 3-Layer App Router Pattern

```
app/(main)/courses/[id]/page.tsx   ← thin wrapper, no logic
src/views/CourseDetail.tsx          ← 'use client', all page logic
src/components/PostCard.tsx         ← leaf components
```

All 26 routes follow this pattern. The `(main)` route group shares a `Layout.tsx` shell (sidebar + header + search).

### One-File Theming (Multi-Club)

**`src/config/club.ts`** is the only file that changes per fork. It exports:
- Club name, tagline, logos
- HSL color strings (e.g. `"195 100% 42%"` — no `hsl()` wrapper)
- Social links, support email
- Feature flags (`chat`, `aiMentor`, `tutorials`, `aiAgents`)

**Color injection chain:** `club.ts` → `ClubThemeProvider` (injects CSS vars at runtime) → `globals.css` @theme block wraps in `hsl()` → Tailwind `bg-primary`, `text-accent` etc.

### Provider Stack (`src/components/Providers.tsx`)

```
ClubThemeProvider → ThemeProvider (dark/light) → AdminProvider → QueryClientProvider → TooltipProvider
```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/app/(main)/` | 26 route wrappers (thin) |
| `src/views/` | Full-page client components (all logic lives here) |
| `src/components/ui/` | 57 shadcn/ui Base UI components |
| `src/config/club.ts` | Club identity + feature flags — customize here |
| `src/data/` | Mock data arrays (courses, events, groups, agents, recordings, levels) |
| `src/hooks/` | `useProfileCompletion`, `useWatchedProgress`, `useUserRole`, `use-mobile` |
| `src/contexts/AdminContext.tsx` | Admin context — `isAdminUser` (DB role) + `isAdmin` (edit-mode toggle) |
| `src/lib/tagColors.ts` | Category tag → color + icon mapping |
| `docs/` | Architecture, schema, forking guide, roadmap |

## Critical Conventions

### shadcn/ui v4 (Base UI)
This project uses **Base UI** (not Radix). Use `render` prop instead of `asChild`:
```tsx
// ❌ Old Radix pattern
<Button asChild><Link href="/">Home</Link></Button>

// ✅ Base UI pattern
<Button render={<Link href="/" />}>Home</Button>
```

### Tailwind v4
- No `tailwind.config.ts` — config lives in `globals.css` via `@theme`
- Custom tokens: `--radius`, `--font-heebo`, `--font-rubik`, color scales

### HSL Color Format
Always use bare HSL values (no `hsl()` wrapper) in `club.ts`:
```ts
colors: { primary: "195 100% 42%" }  // ✅
colors: { primary: "hsl(195, 100%, 42%)" }  // ❌
```

### RTL / Hebrew
- Root `<html dir="rtl" lang="he">` — layout flows right-to-left
- Fonts: Heebo (body) + Rubik (headings)
- Directional classes: use `me-` / `ms-` (logical) over `mr-` / `ml-`

### Toasts (Sonner)
```tsx
import { toast } from "sonner";
toast.success("נשמר!", { description: "השינויים נשמרו בהצלחה" });
toast.error("שגיאה", { description: "נסה שוב" });
```

### Navigation
```tsx
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
const { id } = useParams() as { id: string };
```
**`useSearchParams` requires a `<Suspense>` boundary** in the parent page file.

### Adding Data (Phase 1)
Add to the relevant file in `src/data/`. No DB, no API calls needed yet.

### Image Domains
Allowed external image hosts (configured in `next.config.ts`): `dicebear.com`, `unsplash.com`. Add new domains there if needed.

## Phase 2 Backend Plan (Next Up)

**Phase 1 (next):** Supabase setup + auth (Google OAuth + Magic Link), route protection middleware, profile creation on first sign-in.

**External services:**
| Service | Purpose |
|---|---|
| Supabase Auth | Google OAuth + Magic Link |
| Supabase Storage | Profile images, post images |
| Bunny.net | Video streaming (courses, recordings, tutorials) — `video_url` field in lessons |
| Cardcom | Israeli payment processor — terminal ID 157696, tokenized recurring billing |
| Resend | Transactional email (event reminders, payment notifications) |

**Schema:** See `docs/schema.md` for full DDL. Core tables: `profiles`, `courses`, `lessons`, `lesson_progress`, `events`, `event_rsvps`, `groups`, `group_members`, `posts`, `post_comments`, `post_reactions`, `levels`, `xp_events`, `subscriptions`, `cardcom_tokens`, `notifications`.

**RLS principles:** `subscriptions` and `cardcom_tokens` — service role only, never expose to client. Posts/comments readable by all members, writable/deletable by owner + admin + group moderator.

**CRITICAL — Migrations only:** Every DB change (tables, RLS, triggers, indexes, seed data) MUST go through `supabase/migrations/` files. This database is recreated from scratch for each club fork via `supabase db push`. Never make manual DB changes, never use the Supabase dashboard to modify schema. If it's not in a migration file, it doesn't exist.

**Data migration:** Phase 5 migrates ~7,143 users, 246 lessons, 138K progress records, 6 groups from WordPress (BuddyBoss + LearnDash + WooCommerce + GamiPress). See `docs/data-migration.md`.

When implementing Phase 2, query hooks go in `src/hooks/` and use TanStack Query (already wired up in providers).

## Active Skills

Installed in `.agents/skills/` — invoke these automatically when relevant:

| Skill | Invoke when |
|---|---|
| `supabase-postgres-best-practices` | Writing SQL, RLS policies, RPCs, schema design, migrations |
| `nextjs-app-router-patterns` | Server Components, Server Actions, Suspense boundaries, route handlers |
| `tailwind-design-system` | Tailwind v4 tokens, CVA component variants, design system patterns |

**Dev workflow:** Use `/start-issue` to pick up the next GitHub issue from the project board (dangogit/courses-clubs, Project #6), move it through the Kanban, implement, verify, and create a PR.
