# courses-clubs

Upstream template for Hebrew AI club platforms. Fork this repo to create a branded community platform (courses, events, groups, social feed, AI tools) for a new club — the only file you need to change is `src/config/club.ts`.

> **Current fork:** Brainers Club — קהילת ה-AI הישראלית

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Multi-Club Theming

Every instance of this platform is a fork of this repo. To rebrand for a new club:

1. Edit [`src/config/club.ts`](src/config/club.ts) — name, colors, social links, feature flags
2. Swap logos in `public/assets/` — `club-logo.png`, `club-hero-logo.png`, `favicon.ico`
3. `npm run build` to verify

Full guide: [docs/forking.md](docs/forking.md)

## Routes

| Path | View | Description |
|---|---|---|
| `/` | Feed | Main social feed |
| `/community` | Feed | Alias for feed |
| `/onboarding` | Home | Welcome / getting started |
| `/courses` | Courses | Course catalog |
| `/courses/[id]` | CourseDetail | Course overview + lessons |
| `/courses/[id]/lesson/[lessonId]` | LessonDetail | Lesson player |
| `/recordings` | Recordings | Past session recordings |
| `/recordings/[id]` | RecordingDetail | Recording player |
| `/events` | Events | Upcoming events + calendar |
| `/events/[id]` | EventDetail | Event detail + RSVP |
| `/groups` | Groups | Community groups |
| `/groups/[groupId]` | GroupDetail | Group feed + members |
| `/leaderboard` | Leaderboard | XP rankings |
| `/profile` | Profile | User profile + completion |
| `/admin` | Admin | Admin dashboard + charts |
| `/ai-agents` | AIAgents | AI tool gallery |
| `/ai-agents/[id]` | AgentDetail | Tool detail + launch |
| `/tutorials` | Tutorials | Videos + written guides |
| `/tutorials/video/[id]` | VideoTutorialDetail | Video tutorial |
| `/tutorials/guide/[id]` | GuideDetail | Written guide |
| `/invite` | Invite | Referral tracking |
| `/chats` | Chats | Direct messages |
| `/settings` | Settings | User preferences + notifications |
| `/subscription` | Subscription | Plan management |
| `/contact` | Contact | Contact form |
| `*` | NotFound | 404 |

## Tech Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript strict
- **Styling:** Tailwind CSS v4 · shadcn/ui (Base UI) · Framer Motion
- **State:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Toasts:** Sonner
- **Icons:** Lucide React
- **Fonts:** Heebo + Rubik (Hebrew-first, RTL)

## Docs

- [Architecture](docs/architecture.md) — App Router pattern, theming, data layer, conventions
- [Forking Guide](docs/forking.md) — How to create a new club fork
- [Product Spec](docs/spec.md) — Feature requirements from client
