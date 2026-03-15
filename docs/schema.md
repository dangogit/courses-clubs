# Database Schema — Supabase Design

> Phase 2 target schema. Current Phase 1 uses mock data in `src/data/*.ts` — shapes match these tables.

---

## Auth

Supabase Auth handles `auth.users`. All other tables reference `auth.users.id`.

---

## Access Tiers

```sql
tiers
  id              serial PRIMARY KEY
  level           int NOT NULL UNIQUE    -- 0=free, 1=basic, 2=premium
  name            text NOT NULL          -- admin-editable display name
  description     text
  color           text                   -- bare HSL value for UI badges
  created_at      timestamptz DEFAULT now()
```

Seeded: free (0), basic (1), premium (2). See [subscription-tiers-design.md](superpowers/specs/2026-03-14-subscription-tiers-design.md).

---

## Profiles

```sql
profiles
  id              uuid PRIMARY KEY REFERENCES auth.users
  display_name    text
  first_name      text
  last_name       text
  avatar_url      text        -- Supabase Storage URL
  bio             text
  phone           text
  role            text        -- 'member' | 'moderator' | 'admin'
  tier_level      int DEFAULT 0          -- denormalized from subscription; 0=free, 1=basic, 2=premium
  xp_total        int DEFAULT 0
  level_id        int REFERENCES levels
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
```

---

## Learning Platform

```sql
courses
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  title           text NOT NULL
  description     text
  thumbnail_url   text
  tag             text        -- category tag
  duration_label  text        -- e.g. "6 שעות"
  min_tier_level  int DEFAULT 0          -- 0=free, 1=basic, 2=premium
  order_index     int DEFAULT 0
  is_published    bool DEFAULT false
  created_at      timestamptz DEFAULT now()

lessons
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  course_id       uuid NOT NULL REFERENCES courses ON DELETE CASCADE
  title           text NOT NULL
  description     text
  video_url       text        -- full Bunny.net embed URL
  duration_label  text        -- e.g. "25 דק׳"
  min_tier_level  int DEFAULT NULL       -- NULL = inherit from parent course
  order_index     int DEFAULT 0
  is_published    bool DEFAULT false

lesson_progress
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  lesson_id       uuid NOT NULL REFERENCES lessons ON DELETE CASCADE
  completed_at    timestamptz DEFAULT now()
  PRIMARY KEY (user_id, lesson_id)

recordings
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  title           text NOT NULL
  description     text
  video_url       text
  thumbnail_url   text
  duration_label  text
  recorded_at     date
  tags            text[]
  min_tier_level  int DEFAULT 0          -- 0=free, 1=basic, 2=premium
  is_published    bool DEFAULT false
  created_at      timestamptz DEFAULT now()

tutorials
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  title           text NOT NULL
  type            text NOT NULL    -- 'video' | 'guide'
  video_url       text             -- for video type
  content         text             -- markdown, for guide type
  thumbnail_url   text
  category        text
  duration_label  text
  min_tier_level  int DEFAULT 0          -- 0=free, 1=basic, 2=premium
  is_published    bool DEFAULT false
  created_at      timestamptz DEFAULT now()
```

---

## Events

```sql
events
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  title           text NOT NULL
  description     text
  thumbnail_url   text
  starts_at       timestamptz NOT NULL
  ends_at         timestamptz
  zoom_url        text             -- admin adds manually
  is_online       bool DEFAULT true
  max_attendees   int
  min_tier_level  int DEFAULT 0          -- 0=free, 1=basic, 2=premium
  is_published    bool DEFAULT false
  created_at      timestamptz DEFAULT now()

event_rsvps
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  event_id        uuid NOT NULL REFERENCES events ON DELETE CASCADE
  rsvped_at       timestamptz DEFAULT now()
  PRIMARY KEY (user_id, event_id)
```

---

## Community

```sql
groups
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name            text NOT NULL
  description     text
  thumbnail_url   text
  banner_url      text
  category        text
  is_private      bool DEFAULT false
  min_tier_level  int DEFAULT 0          -- 0=free, 1=basic, 2=premium
  created_by      uuid REFERENCES auth.users
  created_at      timestamptz DEFAULT now()

group_members
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  group_id        uuid NOT NULL REFERENCES groups ON DELETE CASCADE
  role            text DEFAULT 'member'   -- 'member' | 'moderator'
  joined_at       timestamptz DEFAULT now()
  PRIMARY KEY (user_id, group_id)

posts
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  group_id        uuid REFERENCES groups ON DELETE CASCADE   -- null = main feed
  content         text NOT NULL            -- rich text / markdown
  image_url       text
  is_pinned       bool DEFAULT false
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

post_comments
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  post_id         uuid NOT NULL REFERENCES posts ON DELETE CASCADE
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  parent_id       uuid REFERENCES post_comments  -- for threaded replies
  content         text NOT NULL            -- rich text
  created_at      timestamptz DEFAULT now()

post_reactions
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  post_id         uuid NOT NULL REFERENCES posts ON DELETE CASCADE
  reaction_type   text DEFAULT 'like'
  created_at      timestamptz DEFAULT now()
  PRIMARY KEY (user_id, post_id)
```

---

## Gamification

```sql
levels
  id              int PRIMARY KEY
  title           text NOT NULL
  xp_required     int NOT NULL
  badge_url       text
  color           text

xp_events
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  amount          int NOT NULL             -- positive = gain, negative = spend
  reason          text                     -- e.g. 'lesson_completed', 'post_liked'
  reference_id    uuid                     -- optional: lesson/post/event id
  created_at      timestamptz DEFAULT now()
```

---

## AI Tools

```sql
ai_agents
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name            text NOT NULL
  description     text
  category        text
  external_url    text                     -- link to the AI tool
  thumbnail_url   text
  video_url       text                     -- demo video
  is_featured     bool DEFAULT false
  is_published    bool DEFAULT false
  order_index     int DEFAULT 0
  created_at      timestamptz DEFAULT now()
```

---

## Subscriptions & Payments

```sql
subscription_products
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name            text NOT NULL
  price_agorot    int NOT NULL             -- price in agorot (1 ILS = 100 agorot)
  interval        text NOT NULL            -- 'monthly' | 'yearly'
  tier_id         int REFERENCES tiers     -- which tier this product grants
  trial_days      int DEFAULT 0
  is_active       bool DEFAULT true
  created_at      timestamptz DEFAULT now()

subscriptions
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  product_id      uuid REFERENCES subscription_products
  status          text NOT NULL            -- 'trialing' | 'active' | 'past_due' | 'cancelled'
  period_start    timestamptz
  period_end      timestamptz
  cancelled_at    timestamptz
  created_at      timestamptz DEFAULT now()

cardcom_tokens
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  token           text NOT NULL            -- CardCom UUID token
  token_id        text                     -- CardCom numeric token_id
  low_profile_id  text                     -- CardCom LowProfileId (SENSITIVE)
  last4           text
  card_brand      text                     -- 'mastercard' | 'visa' etc.
  expires_at      date
  is_default      bool DEFAULT false
  created_at      timestamptz DEFAULT now()
  UNIQUE (user_id, token)
```

---

## Referrals & Invites

```sql
invite_links
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  code            text UNIQUE NOT NULL
  created_by      uuid REFERENCES auth.users
  discount_percent int DEFAULT 0
  max_uses        int                      -- null = unlimited
  uses_count      int DEFAULT 0
  expires_at      timestamptz
  created_at      timestamptz DEFAULT now()

referrals
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  referrer_id     uuid NOT NULL REFERENCES auth.users
  referred_id     uuid NOT NULL REFERENCES auth.users
  invite_code     text
  reward_xp       int DEFAULT 0
  created_at      timestamptz DEFAULT now()
  UNIQUE (referred_id)                     -- one referrer per signup
```

---

## Notifications

```sql
notifications
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  type            text NOT NULL
    -- 'reply' | 'like' | 'mention' | 'event_reminder'
    -- 'xp_gain' | 'level_up' | 'payment_failed' | 'payment_success'
  title           text NOT NULL
  body            text
  action_url      text
  is_read         bool DEFAULT false
  created_at      timestamptz DEFAULT now()
```

---

## Direct Messages

```sql
message_threads
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  type            text DEFAULT 'direct'    -- 'direct' | 'group'
  created_at      timestamptz DEFAULT now()

thread_participants
  thread_id       uuid NOT NULL REFERENCES message_threads ON DELETE CASCADE
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  last_read_at    timestamptz
  PRIMARY KEY (thread_id, user_id)

messages
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  thread_id       uuid NOT NULL REFERENCES message_threads ON DELETE CASCADE
  sender_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
  content         text NOT NULL
  created_at      timestamptz DEFAULT now()
```

---

## Key Indexes (add on creation)

```sql
CREATE INDEX ON lesson_progress (user_id);
CREATE INDEX ON posts (group_id, created_at DESC);
CREATE INDEX ON post_comments (post_id, created_at);
CREATE INDEX ON xp_events (user_id, created_at DESC);
CREATE INDEX ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX ON subscriptions (user_id, status);
CREATE INDEX ON messages (thread_id, created_at);
```

---

## Row Level Security (RLS) Principles

- `tiers` — readable by all authenticated users; writable via service role only
- `profiles` — readable by all authenticated users; writable only by owner; `role` and `tier_level` columns protected by trigger (cannot be escalated client-side)
- `posts`, `comments` — readable by all members; writable by owner; deletable by owner + admin + group moderator
- `group_members` — INSERT gated by tier: `profiles.tier_level >= groups.min_tier_level`
- `event_rsvps` — INSERT gated by tier: `profiles.tier_level >= events.min_tier_level`
- `subscriptions`, `cardcom_tokens` — readable/writable by owner only (no RLS for admin — use service role)
- `notifications` — readable/writable by owner only
- `lesson_progress` — readable by owner; insertable by owner + triggers
