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
