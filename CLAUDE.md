# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (flat config, v9)
```

No test runner is configured — this is a Phase 1 mock-data app.

## What This Is

A **forked community platform template** for AI education clubs. One repo = one club, deployed per tenant. Currently: Brainers Club (Hebrew AI community).

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui (Base UI) + TanStack React Query v5

**Phase 1 (current):** All data is hardcoded TypeScript mock arrays in `src/data/`. No auth, no backend.
**Phase 2 (planned):** Supabase (auth + database) + Bunny.net video CDN.

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
| `src/hooks/` | `useProfileCompletion`, `useWatchedProgress`, `use-mobile` |
| `src/contexts/AdminContext.tsx` | Admin mode toggle |
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
| Bunny.net | Video streaming (courses, recordings, tutorials) — `bunny_video_id` field in lessons |
| Cardcom | Israeli payment processor — terminal ID 157696, tokenized recurring billing |
| Resend | Transactional email (event reminders, payment notifications) |

**Schema:** See `docs/schema.md` for full DDL. Core tables: `profiles`, `courses`, `lessons`, `lesson_progress`, `events`, `event_rsvps`, `groups`, `group_members`, `posts`, `post_comments`, `post_reactions`, `levels`, `xp_events`, `subscriptions`, `cardcom_tokens`, `notifications`.

**RLS principles:** `subscriptions` and `cardcom_tokens` — service role only, never expose to client. Posts/comments readable by all members, writable/deletable by owner + admin + group moderator.

**Data migration:** Phase 5 migrates ~7,143 users, 246 lessons, 138K progress records, 6 groups from WordPress (BuddyBoss + LearnDash + WooCommerce + GamiPress). See `docs/data-migration.md`.

When implementing Phase 2, query hooks go in `src/hooks/` and use TanStack Query (already wired up in providers).
