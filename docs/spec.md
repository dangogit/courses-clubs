# Product Specification

> Last updated: March 2026 — based on client meeting.

---

## Authentication

- **Provider:** Supabase Auth
- **Methods:** Google OAuth (Gmail) + Magic Link (email)
- **Trial:**
  - Credit card required upfront to start trial
  - If payment fails → immediate access block (no grace period — TBD, see Open Questions)
- **Onboarding flow** — TBD, design later

---

## Subscriptions

- **Payment processor:** [Cardcom](https://www.cardcom.co.il) — Israeli processor, tokenized recurring billing
- **Products:** Admin creates subscription products with custom pricing (not hardcoded tiers)
- **Discounts:**
  - Coupon code — user enters code at checkout
  - Invite link — link has discount embedded (percentage or fixed amount)
- **Family plan** — deferred to V2

---

## User Profile

- All profile fields are **optional** — no mandatory fields
- Profile shows a **completion indicator** (percentage / progress bar) to encourage filling in
- **Profile image:** uploaded to Supabase Storage

---

## Content & Media

| Content type | Storage | Notes |
|---|---|---|
| Course videos | Bunny.net (streaming) + Supabase (metadata) | |
| Recording videos | Bunny.net (streaming) + Supabase (metadata) | |
| Tutorial videos | Bunny.net (streaming) + Supabase (metadata) | |
| Written guides | Supabase DB | Markdown or rich text |
| Post images | Supabase Storage | |
| Profile images | Supabase Storage | |
| Event Zoom links | Supabase DB | Admin adds manually per event |

**Admin CMS:** No separate CMS. Admins edit content **inline** — clicking edit on a course/post/event in the UI opens an edit mode directly.

---

## Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full permissions on all content — create, edit, delete, pin, moderate |
| **Group Moderator** | Moderate content within their group; appointed by Admin only |
| **Member** | Read access to all content; create posts, comments, RSVP to events |

- Only Admin can appoint group moderators (not self-service)
- Admin role is set directly in the database

---

## Community Features

- **Comments:** Rich text support — bold, italic, lists (basic formatting)
- **Posts:** Supports @mentions in the create post dialog
- **Reactions:** Like on posts and comments
- **Moderation:** Admin + moderators can delete or pin posts in their scope

---

## Notifications

- **Channels:** Email + in-app bell only. No push notifications (for now).
- **Triggers for regular members:**
  - Reply to your post or comment
  - Like on your post
  - Upcoming event reminder (timing TBD — see Open Questions)
- **User settings:** Members can manage notification preferences at `/settings`
- **Admin notifications:** TBD

---

## AI Mentor

- Connects to a real AI model — Claude (Anthropic) or OpenAI (configurable)
- System prompt is customized with the club's course content, tone, and guidelines
- Accessible via the floating chat button (bottom-right corner of all pages)
- Feature can be disabled per-fork via `club.features.aiMentor = false`

---

## Email

**Transactional emails** (Resend):
- Magic link sign-in
- Event reminders (timing TBD — see Open Questions)
- Payment receipt, failed payment alert, dunning emails
- Mention and reply notifications (if user has email notifications enabled)

**Campaign webhook integration** *(details TBD — confirm with client):*
- Outgoing webhook that fires on key lifecycle events: user signup, subscription start, subscription cancel, level-up
- Pushes contact data into an external marketing email tool (provider TBD — e.g. Mailchimp, ActiveCampaign, or similar)
- Open questions to resolve with client:
  1. Which marketing email provider?
  2. Which events trigger the webhook?
  3. What contact fields are included (email, name, plan, XP level)?

---

## Open Questions

These need answers before backend implementation:

1. **Failed payment grace period** — immediate block or X days grace period?
2. **Event reminder timing** — how many hours before the event should the reminder notification fire?
3. **Image upload limits** — maximum file size for user-uploaded profile/post images?
4. **Contact form access** — who can submit the contact form: all members, or active (paid) subscribers only?
