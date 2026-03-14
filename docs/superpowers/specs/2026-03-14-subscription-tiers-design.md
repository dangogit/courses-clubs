# Subscription Tiers & Content Access Control

## Problem

The platform currently has an all-or-nothing subscription model: you either subscribe or you don't. Admins need the ability to create differentiated access tiers (Free, Basic, Premium) and control which content each tier can access, per item.

## Decision: Numeric Tier Levels (Approach B)

A `tiers` table with integer `level` values. Content tables store `min_tier_level INT`. Access check: `user.tier_level >= content.min_tier_level`. Adding future tiers requires only a row insert — no schema migration needed.

Alternatives considered:
- **Enum column** — simpler but hardcoded; adding tiers requires migrations and CHECK constraint updates
- **Access tags (array)** — most flexible but over-engineered for a hierarchical model; messier RLS

## Data Model

### `tiers` table (new)

Uses `SERIAL` (not uuid) since tier IDs are small, ordered lookup values referenced by integer level throughout the system.

```sql
CREATE TABLE tiers (
  id          SERIAL PRIMARY KEY,
  level       INT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,                    -- bare HSL value for UI badges
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Seed data:

| level | name | color |
|-------|------|-------|
| 0 | חינם (Free) | `"120 60% 40%"` |
| 1 | בסיסי (Basic) | `"195 100% 42%"` |
| 2 | פרימיום (Premium) | `"45 100% 50%"` |

Fork admins can rename tiers to match their branding.

### `tiers` RLS policies

```sql
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tiers_select ON tiers FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policies — managed via service role or admin RPCs only
```

### Content table changes

Every gatable content table gains:

```sql
min_tier_level INT NOT NULL DEFAULT 0
```

Applied to: `courses`, `lessons` (nullable), `recordings`, `groups`, `events`, `tutorials`, `ai_agents` (when implemented).

**Lessons** use a nullable override:

```sql
-- lessons table
min_tier_level INT DEFAULT NULL  -- NULL = inherit from parent course
```

Access check for lessons: `COALESCE(lesson.min_tier_level, course.min_tier_level)`.

### Modified existing tables

| Table | Change |
|-------|--------|
| `profiles` | Add `tier_level INT NOT NULL DEFAULT 0` (denormalized, protected by trigger) |
| `subscription_products` | Add `tier_id INT REFERENCES tiers(id)` |

### Protecting `tier_level` from client-side manipulation

The existing `protect_role_column()` trigger prevents users from escalating their own role. The same protection must extend to `tier_level` — without it, any authenticated user could `UPDATE profiles SET tier_level = 2` to grant themselves premium access.

**Important:** PostgreSQL triggers fire for ALL operations — including service-role queries and SECURITY DEFINER functions. They bypass RLS, not triggers. To allow system functions (`sync_tier_level`, admin comp accounts) to modify protected columns, the trigger uses a session variable bypass:

```sql
CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS trigger AS $$
BEGIN
  -- Skip protection when system functions set the bypass flag
  IF current_setting('app.bypass_column_protection', true) IS DISTINCT FROM 'true' THEN
    NEW.role := OLD.role;
    NEW.tier_level := OLD.tier_level;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Replaces the existing `protect_role_column()` function. The bypass flag is a transaction-local session variable set only by SECURITY DEFINER functions that legitimately need to update these columns.

### Admin tier overrides (comp accounts)

For granting access without a subscription (beta testers, comp accounts, staff), an RPC function with SECURITY DEFINER sets `profiles.tier_level` directly:

```sql
CREATE OR REPLACE FUNCTION admin_set_tier_level(target_user_id UUID, new_level INT)
RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set tier levels';
  END IF;

  -- Bypass the column protection trigger
  PERFORM set_config('app.bypass_column_protection', 'true', true);

  UPDATE profiles SET tier_level = new_level WHERE id = target_user_id;

  PERFORM set_config('app.bypass_column_protection', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Called from the admin UI via `supabase.rpc('admin_set_tier_level', { target_user_id, new_level })`.

### New trigger: `sync_tier_level()`

Updates `profiles.tier_level` when subscriptions change. Users with `past_due` or `cancelled` subscriptions are treated as free tier (level 0) — access is revoked immediately, not after a grace period.

```sql
CREATE OR REPLACE FUNCTION sync_tier_level()
RETURNS trigger AS $$
DECLARE
  target_user_id UUID;
  effective_level INT;
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT COALESCE(MAX(t.level), 0) INTO effective_level
  FROM subscriptions s
  JOIN subscription_products sp ON sp.id = s.product_id
  JOIN tiers t ON t.id = sp.tier_id
  WHERE s.user_id = target_user_id
    AND s.status IN ('active', 'trialing');

  -- Bypass the column protection trigger for this system update
  PERFORM set_config('app.bypass_column_protection', 'true', true);

  UPDATE profiles
  SET tier_level = effective_level
  WHERE id = target_user_id;

  PERFORM set_config('app.bypass_column_protection', '', true);

  RETURN NULL;  -- AFTER trigger, return value is ignored
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_tier_level_trigger
  AFTER INSERT OR UPDATE OF status, product_id OR DELETE
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_tier_level();
```

### Recommended indexes

```sql
CREATE INDEX idx_profiles_tier_level ON profiles (tier_level);
-- Content table indexes added per-table in their respective migrations
```

## Access Control Pattern

### Key clarification: `min_tier_level = 0` means "all authenticated users"

The auth middleware already protects all routes — unauthenticated visitors are redirected to `/login`. Within the platform, tier level 0 ("Free") means "any signed-in user." There is no public/anonymous content.

### Principle: visible but locked

All authenticated users can SELECT all content metadata (titles, descriptions, thumbnails). Locked items appear in listings with a lock icon and upgrade CTA. Content is never hidden from lower-tier users.

### Three gating layers

| Layer | What it gates | How |
|-------|--------------|-----|
| **UI (views)** | Visual lock overlay on content cards/pages | `userTierLevel >= content.minTierLevel` check in React |
| **Server-side APIs** | Video signed URLs, AI completions | Server checks tier before generating Bunny.net signed URLs or calling AI APIs |
| **RLS (write operations)** | Posting in groups, RSVPing to events, joining groups | RLS INSERT/UPDATE policies check `profiles.tier_level >= content.min_tier_level` |

### Why not RLS for reads?

RLS-blocking SELECT would hide locked content entirely. The "visible but locked" requirement means users must be able to query content metadata regardless of tier. Sensitive payloads (video URLs, AI responses) are served through server-side APIs that perform tier checks.

### Group content access

Group membership is gated by tier — the `group_members` INSERT policy checks the user's tier against the group's `min_tier_level`. Users who don't meet the tier cannot join the group, and therefore cannot post. Posts within a group inherit the group's access level implicitly through membership, not through individual post-level checks.

For reading posts: the posts query joins through the user's group memberships. Non-members (who failed the tier check to join) simply have no membership row, so their queries return no posts for that group. The UI shows the group card with a lock overlay. This is enforced at the query level (not just UI), since the TanStack Query hook for posts filters by `group_members` membership.

### Example RLS policy: `event_rsvps` INSERT

```sql
CREATE POLICY event_rsvps_insert ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.id = event_rsvps.event_id
        AND p.tier_level >= e.min_tier_level
    )
  );
```

### Example RLS policy: `group_members` INSERT

```sql
CREATE POLICY group_members_insert ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groups g
      JOIN profiles p ON p.id = auth.uid()
      WHERE g.id = group_members.group_id
        AND p.tier_level >= g.min_tier_level
    )
  );
```

### Video URL signing (server-side gate)

Video content is hosted on Bunny.net. The flow:

1. Client requests a lesson's video → calls a Next.js API route or Server Action
2. Server checks `profiles.tier_level >= COALESCE(lesson.min_tier_level, course.min_tier_level)` using the server Supabase client
3. If authorized, server generates a time-limited Bunny.net signed URL (expires in ~4 hours)
4. If unauthorized, returns 403

Signed URLs are time-limited, so sharing them provides only temporary access. This is the standard approach for video CDN paywalls and is sufficient for this use case.

### Practical access matrix

| Action | Gate | Free | Basic | Premium |
|--------|------|------|-------|---------|
| See course card in listing | None (authenticated) | Yes | Yes | Yes |
| Watch a free lesson | Server (signed URL) | Yes | Yes | Yes |
| Watch a basic lesson | Server (signed URL) | Lock | Yes | Yes |
| Watch a premium lesson | Server (signed URL) | Lock | Lock | Yes |
| See group card (locked) | None (authenticated) | Yes | Yes | Yes |
| Join a basic group | RLS on INSERT (group_members) | Block | Yes | Yes |
| Read posts in joined group | Query via membership | Yes (if joined) | Yes | Yes |
| Post in a group | RLS on INSERT (posts) | Only if member | Yes | Yes |
| RSVP to a premium event | RLS on INSERT (event_rsvps) | Block | Block | Yes |
| Use AI Mentor | Edge Function | Depends on setting | Depends | Depends |

## Admin UI

### Tier selector on content items

When admin mode is active (existing `AdminContext` toggle), content editing surfaces show an **Access Level** control — three color-coded pill buttons (radio-style):

```
רמת גישה:  [חינם]  [בסיסי]  [פרימיום]
```

Current tier is highlighted. One click to change. Applied to courses, groups, events, recordings, tutorials, and AI agents.

### Lesson-level override

Inside the course editor, each lesson row shows a small tier badge. Default: "ירושה" (inherited) matching the course's tier. Admin can click to override a specific lesson — e.g., making lesson 1 free as a preview in a premium course.

Setting a course's tier applies to all lessons that haven't been explicitly overridden.

### Tiers management (admin settings)

A section under admin settings where admins can:
- Rename tiers (e.g., "בסיסי" → "סטנדרט")
- Set tier colors and descriptions
- See which subscription products are linked to each tier

The three default tiers (Free, Basic, Premium) are seeded and sufficient for the platform. Adding new tiers is a database operation (INSERT into `tiers` table) — no schema migration is needed, but it is restricted to service-role access to prevent misconfiguration. This can be exposed in the admin UI in a future iteration if needed.

### No bulk operations in v1

Admins set access per item. No "make all courses premium" bulk action initially.

## Mock Data Update

The `src/data/` mock arrays gain a `minTierLevel` field so UI development can proceed before Supabase wiring:

```typescript
// src/data/courses.ts — Course type gains minTierLevel
export interface Course {
  // ... existing fields
  minTierLevel: number;  // 0=free, 1=basic, 2=premium
}

// src/data/lessons.ts — Lesson type gains optional override
export interface Lesson {
  // ... existing fields
  minTierLevel?: number;  // undefined = inherit from course
}
```

Note: mock data currently uses array indexes as implicit IDs. The `minTierLevel` field works with the existing pattern — no `id` field changes needed in Phase 1 mock data.

## TypeScript Types

```typescript
// src/lib/types/tiers.ts
export interface Tier {
  id: number;
  level: number;
  name: string;
  description: string | null;
  color: string | null;
}

// Helper for access checks (used in views)
export function canAccess(userTierLevel: number, contentMinTierLevel: number): boolean {
  return userTierLevel >= contentMinTierLevel;
}

// For lessons with inheritance
export function getEffectiveTierLevel(
  lessonMinTierLevel: number | null | undefined,
  courseMinTierLevel: number
): number {
  return lessonMinTierLevel ?? courseMinTierLevel;
}
```

## What Stays Unchanged

- **`handle_new_user()` trigger** — no changes needed; new users get `tier_level = 0` via the DEFAULT constraint, which is correct (all new signups are free tier)
- **`levels` table** — XP/gamification, unrelated to subscription tiers
- **`posts`, `post_comments`** — gated by their parent group's membership, not individually
- **Auth flow and middleware** — no changes needed
- **Feature flags in `club.ts`** — control feature visibility per fork, orthogonal to tier gating

## Open Questions

1. **AI Mentor / AI Agents tier default** — should these default to premium (2) or basic (1)?
2. **Subscription product ↔ tier mapping UI** — is this part of the tiers admin page or the product creation flow? (Deferred to Phase 3 CardCom integration)

## Dependencies

- Requires `subscription_products` and `subscriptions` tables (Phase 3) for the `sync_tier_level` trigger to fire
- Tier column and UI gating can be implemented in Phase 2 alongside content wiring
- The `sync_tier_level` trigger activates when Phase 3 payments are wired
- Admin comp-account endpoint requires service-role Supabase client (Phase 3+)
