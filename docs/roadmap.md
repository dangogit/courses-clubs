# Project Roadmap

## Overview

Three-tier delivery: **Main Repo** (upstream template) → **Forks** (per club) → **Customizations** (branding + content).
Bug fixes and new features flow from main repo to all forks.

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** | Frontend migration (Vite → Next.js, 26 routes) | ✅ Complete |
| **Phase 1** | Supabase setup + authentication | 🔲 Next |
| **Phase 2** | Learning platform + community + events (backend) | 🔲 Planned |
| **Phase 3** | Gamification + payments (CardCom) | 🔲 Planned |
| **Phase 4** | Admin, notifications, AI Mentor, search | 🔲 Planned |
| **Phase 5** | Data migration from WordPress | 🔲 Planned |

---

## Phase 1 — Supabase Setup + Auth (1 day)

- Supabase project setup, schema creation (see [schema.md](schema.md))
- Supabase Auth: Google OAuth + Magic Link
- Auth middleware: protect all routes, redirect unauthenticated users
- Session persistence
- User profile creation on first sign-in

**✅ Verification — must pass before Phase 2:**
- [ ] Google OAuth sign-in completes and creates a row in `profiles`
- [ ] Magic Link email arrives and signs user in
- [ ] Unauthenticated visit to any protected route redirects to login
- [ ] Session persists across page reload

---

## Phase 2 — Learning Platform + Community + Events (5.5 days)

**Learning (2.5 days)**
- Connect courses, lessons, recordings to Supabase (replace mock data)
- Bunny.net video player integration
- Lesson progress tracking (mark complete, progress bar)
- Recording library with category filtering + search
- `min_tier_level` column on courses, lessons, recordings, tutorials — admin sets access level

**Community (3 days)**
- Social feed: posts, likes, comments wired to real DB
- Groups: membership, group-specific feeds (group join gated by tier)
- @mention functionality (notify mentioned users)

**Events (1 day)**
- Event listings and detail pages wired to Supabase
- RSVP system (gated by event tier level)
- Email reminders (via Resend)
- Calendar export (.ics)

**Access Tiers (woven into above)**
- `tiers` table migration + seed data (free/basic/premium)
- Tier selector UI on content items (admin mode)
- "Visible but locked" pattern: lock overlay + upgrade CTA on gated content
- Lesson-level tier override (inherit from course by default)
- Video signed URL gate: server checks tier before generating Bunny.net URL
- See [subscription-tiers-design.md](superpowers/specs/2026-03-14-subscription-tiers-design.md)

**✅ Verification — must pass before Phase 3:**
- [ ] Course catalog loads from Supabase (not mock data)
- [ ] Lesson progress persists to DB and survives page reload
- [ ] Bunny.net video plays in lesson player and recording player
- [ ] Post created in feed appears for another user without page refresh
- [ ] Group feed is scoped to group members only
- [ ] RSVP to event creates a row in `event_rsvps`
- [ ] Event reminder email fires (manual trigger via Supabase Edge Function invoke)
- [ ] Admin can set course/group/event tier level via in-app selector
- [ ] Free-tier user sees locked content with upgrade CTA (not hidden)
- [ ] Video URL endpoint returns 403 for under-tiered users

---

## Phase 3 — Gamification + Payments (8 days)

**Gamification (3 days)**
- XP system with automated triggers (lesson complete, post created, event attended, referral)
- Levels: unlock at XP thresholds, celebration animation
- Leaderboards: weekly / monthly / all-time
- Referral links: unique codes, signup tracking, XP rewards

**Payments (5 days)**
- CardCom integration with existing terminal (ID: 157696)
- Subscription management: create, cancel, update card
- Trial flow: credit card required upfront; block on failed payment
- Automatic retry on failed billing with dunning emails
- Cancellation popup with discount offer (retention flow)
- Admin: create/edit subscription products with custom pricing + tier assignment
- Coupon codes + invite links with embedded discounts
- `sync_tier_level` trigger: auto-update `profiles.tier_level` on subscription changes
- Admin comp accounts: `admin_set_tier_level` RPC for granting access without payment

**✅ Verification — must pass before Phase 4:**
- [ ] Completing a lesson awards XP and updates `xp_events` table
- [ ] Level-up triggers celebration animation and updates `profiles.level_id`
- [ ] Referral link signup credits referrer with XP
- [ ] CardCom test card completes checkout and creates `subscriptions` row with status `trialing`
- [ ] Failed payment (use CardCom test decline card) transitions subscription to `past_due` and blocks access (tier_level resets to 0)
- [ ] Cancellation flow presents discount offer before confirming cancel
- [ ] `sync_tier_level` trigger correctly updates `profiles.tier_level` on subscription status change
- [ ] Admin can grant tier override via `admin_set_tier_level` RPC (comp accounts)

---

## Phase 4 — Admin, Notifications, AI, Search (7 days)

**Admin panel (3 days)**
- Dashboard stats: connect Recharts to live Supabase data
- Inline CMS: edit courses, recordings, events directly in UI
- User management: view, suspend, change roles, set tier overrides
- Tiers management: rename tiers, set colors/descriptions
- Moderation: delete posts, pin announcements

**Notifications (1.5 days)**
- In-app bell + notification feed (real-time via Supabase Realtime)
- Email notifications via Resend
- Triggers: reply, like, mention, event reminder, XP gain, payment events
- User-controlled preferences at `/settings`

**AI Mentor (1 day)**
- Wire floating chat to real AI API (Claude or OpenAI)
- System prompt: inject club course catalog + tone guidelines
- Conversation history (session-scoped)

**Email System (1 day)**
- Transactional emails via Resend (event reminders, payment receipts, failed payment alerts, magic link)
- Campaign webhook integration (see [spec.md](spec.md#email) — details TBD with client)

**Search (1.5 days)**
- Global search wired to Supabase full-text search
- Scope: courses, recordings, events, posts, users, groups, agents
- Autocomplete dropdown in header (already built, needs backend)

**✅ Verification — must pass before Phase 5:**
- [ ] Admin dashboard stats reflect live DB counts (not mocked)
- [ ] Inline course edit saves to Supabase
- [ ] Reply notification appears in bell within 5 seconds (Supabase Realtime)
- [ ] Email notification arrives for reply (Resend)
- [ ] AI Mentor responds using club course catalog context
- [ ] Global search returns results from courses, recordings, events, posts, users, and groups

---

## Phase 5 — Data Migration (3 days)

Migrate existing Brainers users and content from WordPress (see [data-migration.md](data-migration.md)).

**Day 1 (1.5 days)**
- Users + profiles + Google OAuth links (7,143 users, 2,837 Google accounts)
- CardCom billing tokens (7,099 tokens → `cardcom_tokens`)
- Active subscriptions (4,588 → `subscriptions`)

**Day 2 (1 day)**
- Courses + lessons + progress (246 lessons, 138K progress records)
- Levels + XP points (15 levels, 5,467 users)
- Groups + members (6 groups, 3,534 members)

**Day 3 (0.5 days)**
- Recordings (108)
- AI Agents (20)
- Activity feed + reactions (1,313 posts, 9,511 reactions)
- Referrals + notifications (recent/unread only)

**✅ Verification — must pass before launch:**
- [ ] Spot-check 10 random users: profile, subscription status, XP, and lesson progress match WordPress source
- [ ] All 108 recordings appear in the recording library
- [ ] All 20 AI agents appear in the gallery
- [ ] 6 BuddyBoss groups migrated with correct member counts (±5%)
- [ ] CardCom tokens migrated — test charge succeeds for a migrated token
- [ ] No orphaned foreign keys (run `SELECT` checks on all junction tables)

---

## Optional Features (post-core)

Available as add-ons. Each is independent and can be added to any fork.

| Feature | Description | Est. Days | Price |
|---|---|---|---|
| **Private Messages** | Real-time 1:1 and group DMs, inbox, unread indicators | 4 | ₪7,000 |
| **Member Directory** | Searchable member list, filter by level/role | 1.5 | ₪2,625 |
| **Live Presence** | Online indicators, active member count | 1 | ₪1,750 |
| **Resource Library** | Community file sharing: PDFs, templates, downloads | 2 | ₪3,500 |
| **WhatsApp Automation** | Green API: welcome, event reminders, payment failure | 2.5 | ₪4,375 |
| **Email Sequence Builder** | Visual drip sequence builder with conditions + analytics | 4.5 | ₪7,875 |
| **Category Leaderboards** | Rankings per course or group, time-period filtering | 1.5 | ₪2,625 |
| **English Support** | Language toggle, full translation, LTR/RTL switching | 2 | ₪3,500 |

---

## Monthly Infrastructure Costs

Per club, per month:

| Service | Cost |
|---|---|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Resend (email) | $20 |
| Bunny.net (video) | existing account |
| CardCom | existing account |
| **Total** | **~$65–80/month** |

Optional additions: Green API (WhatsApp) ~$15/month

---

## Pricing Summary (Core)

| Package | Days | Price |
|---|---|---|
| Core (Phases 1–5) | 30 | ₪52,500 |
| All Optionals | +19 | +₪33,250 |
| Complete | 49 | ₪85,750 |

**Maintenance tiers (monthly):**
- Basic (2 days/month, 5-day response): ₪4,000
- Standard (5 days/month, 2-day response): ₪8,000
- Premium (10 days/month, same-day): ₪15,000

---

## Deliverables

- Complete source code (client-owned)
- Main repo + 2 forks (Brainers, Next Level)
- Data migration from WordPress
- Production deployment
- Admin documentation
- 30-day post-launch support
