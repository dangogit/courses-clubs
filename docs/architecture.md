# Architecture

## Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (main)/                 # Route group — all pages wrapped in Layout
│   │   ├── page.tsx            # / → Feed
│   │   ├── courses/            # /courses, /courses/[id], /courses/[id]/lesson/[lessonId]
│   │   ├── events/             # /events, /events/[id]
│   │   ├── recordings/         # /recordings, /recordings/[id]
│   │   ├── groups/             # /groups, /groups/[groupId]
│   │   ├── tutorials/          # /tutorials, /tutorials/video/[id], /tutorials/guide/[id]
│   │   ├── ai-agents/          # /ai-agents, /ai-agents/[id]
│   │   ├── admin/              # /admin
│   │   ├── leaderboard/        # /leaderboard
│   │   ├── profile/            # /profile
│   │   ├── chats/              # /chats
│   │   ├── settings/           # /settings
│   │   ├── subscription/       # /subscription
│   │   ├── invite/             # /invite
│   │   └── contact/            # /contact
│   ├── layout.tsx              # Root layout: fonts, html lang/dir, Providers
│   ├── globals.css             # Tailwind + CSS variables (HSL design tokens)
│   ├── loading.tsx             # Global loading spinner (Hebrew)
│   └── not-found.tsx           # 404 page
│
├── views/                      # Full-page view components (all 'use client')
│   ├── Feed.tsx                # Social feed
│   ├── Courses.tsx             # Course catalog
│   └── ...                     # One file per route
│
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui primitives (57 components)
│   ├── admin/                  # Admin-only components (charts, CMS, etc.)
│   ├── Layout.tsx              # App shell: sidebar + header + search
│   ├── Providers.tsx           # QueryClient + ThemeProvider + ClubThemeProvider
│   ├── ClubThemeProvider.tsx   # Injects club CSS variables at runtime
│   ├── AIMentor.tsx            # Floating AI chat button
│   ├── PostCard.tsx            # Social feed post
│   ├── CommentsSection.tsx     # Comment thread
│   └── ...
│
├── config/
│   └── club.ts                 # THE file forks override — identity, colors, features
│
├── data/                       # Mock data (replaced by Supabase in Phase 2)
│   ├── courses.ts
│   ├── recordings.ts
│   ├── groups.ts
│   ├── agents.ts
│   ├── tutorials.ts
│   └── levels.ts
│
├── hooks/                      # Custom React hooks
├── contexts/
│   └── AdminContext.tsx        # Admin mode toggle
└── lib/
    ├── utils.ts                # cn() utility
    └── tagColors.ts            # Category tag colors + icons
```

---

## App Router Pattern

Every route follows the same 3-layer pattern:

```
app/(main)/courses/[id]/page.tsx    ← thin wrapper (no logic)
        ↓
src/views/CourseDetail.tsx          ← 'use client', all logic here
        ↓
src/components/PostCard.tsx etc.    ← reusable leaf components
```

**Why:** Next.js page files run on the server by default. Since this app is client-heavy (state, interactivity, animations), views are `'use client'` and page files just render `<Layout><SomeView /></Layout>`.

Example page file:
```tsx
// app/(main)/courses/[id]/page.tsx
import Layout from "@/components/Layout";
import CourseDetail from "@/views/CourseDetail";

export default function Page() {
  return <Layout><CourseDetail /></Layout>;
}
```

---

## Multi-Club Theming

One file to rebrand the entire app: **`src/config/club.ts`**

The flow from config → screen:

```
src/config/club.ts
  → club.colors.primary = "195 100% 42%"          (HSL string)
  → ClubThemeProvider injects --primary CSS var
  → globals.css @theme inline: --color-primary: hsl(var(--primary))
  → Tailwind generates bg-primary, text-primary, etc.
  → All components using bg-primary reflect the club's color
```

**`ClubThemeProvider`** wraps the whole app via `Providers.tsx`:
```tsx
// src/components/ClubThemeProvider.tsx
'use client';
import { club } from "@/config/club";

export function ClubThemeProvider({ children }) {
  return (
    <div style={{
      '--primary': club.colors.primary,
      '--primary-foreground': club.colors.primaryForeground,
      '--accent': club.colors.accent,
      '--accent-foreground': club.colors.accentForeground,
    } as React.CSSProperties}>
      {children}
    </div>
  );
}
```

**Color format:** HSL components without `hsl()` wrapper — e.g. `"195 100% 42%"` not `"hsl(195, 100%, 42%)"`. The wrapper is added in `globals.css`.

---

## Data Layer

**Current (Phase 1 — mock data):**
- All data lives in `src/data/*.ts` as typed TypeScript arrays
- No API calls, no loading states, instant renders
- Shapes match what the Supabase schema will look like

**Phase 2 (Supabase):**
- Replace `src/data/*.ts` imports with TanStack Query hooks
- Query hooks (`src/hooks/use*.ts`) already exist in some files — wire them to real API calls
- Component shapes don't change — only the data source

---

## Key Conventions

### shadcn/ui v4 — `render` prop, not `asChild`

shadcn v4 uses Base UI instead of Radix. The `asChild` prop is replaced with `render`:

```tsx
// ❌ Old (shadcn v3 / Radix)
<Button asChild><Link href="/courses">Courses</Link></Button>

// ✅ New (shadcn v4 / Base UI)
<Button render={<Link href="/courses" />}>Courses</Button>
```

### Toasts — Sonner

```tsx
import { toast } from "sonner";

toast.success("נשמר!", { description: "השינויים נשמרו בהצלחה" });
toast.error("שגיאה", { description: "נסה שוב" });
```

### Navigation — `next/navigation`

```tsx
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";

const router = useRouter();
router.push("/courses");

const { id } = useParams() as { id: string };
const pathname = usePathname();
```

### `useSearchParams` — requires Suspense boundary

```tsx
// app/(main)/chats/page.tsx
export default function Page() {
  return (
    <Layout>
      <Suspense>
        <Chats />
      </Suspense>
    </Layout>
  );
}
```

### RTL Hebrew

Root layout sets `<html lang="he" dir="rtl">`. Heebo (body) and Rubik (headings) loaded via `next/font/google`. No additional RTL configuration needed — Tailwind's `rtl:` variants are available if needed.

---

## External Services (Phase 2)

| Service | Purpose |
|---|---|
| **Supabase Auth** | Google OAuth + Magic Link authentication |
| **Supabase Storage** | User profile images, post images |
| **Supabase DB** | All platform data (replaces `src/data/`) |
| **Bunny.net** | Video streaming (courses, recordings, tutorials) |
| **Cardcom** | Israeli payment processor — tokenized recurring billing |

---

## Supabase Architecture — Multi-Club Setup

### One project per club, shared migrations

Each club (Brainers, Next Level, future clubs) has its own isolated Supabase project with separate database, auth, and storage. The upstream repo contains all migration files. Setting up a new club's DB is:

```bash
supabase link --project-ref <new-club-project-ref>
supabase db push    # applies all migrations from supabase/migrations/
supabase db seed    # seeds levels, default config
```

All club credentials live in `.env.local` (never committed). See `.env.local.example`.

---

### Directory structure

```
supabase/
├── config.toml                    # Local dev config (ports, etc.)
├── seed.sql                       # Static data: 15 levels, default XP config
├── migrations/
│   ├── 20240101000000_phase1_auth.sql         # profiles table + RLS + trigger
│   ├── 20240101000001_phase2_learning.sql     # courses, lessons, lesson_progress + RLS
│   ├── 20240101000002_phase2_recordings.sql   # recordings + RLS
│   ├── 20240101000003_phase2_community.sql    # groups, posts, comments, reactions + RLS
│   ├── 20240101000004_phase2_events.sql       # events, event_rsvps + RLS
│   ├── 20240101000005_phase3_gamification.sql # levels, xp_events + triggers + RLS
│   ├── 20240101000006_phase3_payments.sql     # subscriptions, cardcom_tokens + RLS
│   ├── 20240101000007_phase4_notifications.sql# notifications + RLS
│   ├── 20240101000008_phase4_messages.sql     # message_threads, messages + RLS
│   ├── 20240101000009_phase4_search.sql       # full-text search indexes + search RPC
│   └── 20240101000010_rpcs.sql               # all stored functions / RPCs
└── functions/                     # Supabase Edge Functions
    ├── process-cardcom-webhook/   # Payment events (uses service role)
    ├── send-event-reminder/       # Cron-triggered via pg_cron
    ├── send-notification-email/   # Resend transactional emails
    ├── ai-mentor-chat/            # AI completion (Claude or OpenAI)
    └── campaign-webhook/          # Outgoing to marketing email tool (TBD)
```

**Golden rule: never edit an existing migration file.** Once applied to any environment, it's immutable. All changes go in a new migration.

---

### What belongs in each migration file

Each migration is **self-contained by feature**: table DDL + its RLS policies + its triggers. This keeps related logic together and avoids ordering issues.

```sql
-- Example: 20240101000003_phase2_community.sql

-- 1. Tables
CREATE TABLE groups (...);
CREATE TABLE posts (...);
CREATE TABLE post_comments (...);
CREATE TABLE post_reactions (...);

-- 2. Indexes
CREATE INDEX ON posts (group_id, created_at DESC);
CREATE INDEX ON post_comments (post_id, created_at);

-- 3. RLS — enable + policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "posts_insert" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete" ON posts FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- 4. Triggers (if any)
CREATE TRIGGER on_post_insert ...
```

---

### RLS rules by table

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | all authenticated | — (trigger creates it) | owner only | — |
| `courses`, `lessons`, `recordings` | all authenticated | admin only (service role) | admin only | admin only |
| `lesson_progress` | owner only | owner only | — | — |
| `posts`, `post_comments` | all authenticated | authenticated | owner only | owner + admin + moderator |
| `post_reactions` | all authenticated | authenticated | — | owner only |
| `event_rsvps` | all authenticated | authenticated | — | owner only |
| `group_members` | all authenticated | authenticated | — | owner only |
| `xp_events` | owner only | service role only (via RPC) | — | — |
| `subscriptions` | owner only | service role only | service role only | — |
| `cardcom_tokens` | **none** (service role only) | service role only | service role only | — |
| `notifications` | owner only | service role only | owner (is_read) | owner only |
| `messages` | thread participant | thread participant | — | sender only |

`cardcom_tokens` has no client-accessible RLS — all billing operations go through Edge Functions using the service role key.

---

### RPCs (call via `supabase.rpc()`)

Defined in `supabase/migrations/..._rpcs.sql`:

| Function | Purpose |
|---|---|
| `increment_xp(user_id, amount, reason, reference_id)` | Atomic XP insert + level-up check, returns new level if changed |
| `get_user_xp_rank(user_id)` | Returns leaderboard rank (all-time / weekly / monthly) |
| `search_content(query text, types text[])` | Full-text search across courses, recordings, posts, events, users, groups |
| `get_or_create_dm_thread(other_user_id)` | Finds or creates a direct message thread |

---

### Edge Functions

All Edge Functions use the **service role key** and run server-side. Never expose service role to the client.

| Function | Trigger | Notes |
|---|---|---|
| `process-cardcom-webhook` | HTTP POST from Cardcom | Validates HMAC, updates subscription status |
| `send-event-reminder` | pg_cron (X hours before event) | Sends via Resend; timing TBD with client |
| `send-notification-email` | Called from DB trigger or other function | Resend transactional |
| `ai-mentor-chat` | HTTP POST from client | Streams Claude/OpenAI response |
| `campaign-webhook` | Called on signup/subscribe/cancel/level-up | Provider TBD with client |

---

### TypeScript types

After any schema change, regenerate and commit:
```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

All hooks and server utilities import from `src/lib/database.types.ts`. Never write manual type definitions for DB rows.

---

### Brainers-specific migration scripts

The one-time WordPress import scripts are **not** Supabase migrations. They live in the Brainers fork only:
```
scripts/wordpress-migration/
├── 01-users.ts
├── 02-subscriptions.ts
├── 03-courses.ts
└── ...
```
These run once against the Brainers Supabase project. The upstream template stays clean.
