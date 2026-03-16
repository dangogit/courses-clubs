-- Phase 2: Events — events and event_rsvps tables
-- Tables, indexes, and RLS policies for the events calendar feature

-- =============================================================================
-- 1. Events
-- =============================================================================

CREATE TABLE events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  description         text,
  thumbnail_url       text,
  starts_at           timestamptz NOT NULL,
  ends_at             timestamptz,
  zoom_url            text,
  is_online           bool NOT NULL DEFAULT true,
  max_attendees       int,
  event_type          text,               -- 'הרצאה' | 'סדנה' | 'אסטרטגיה'
  speaker_name        text,               -- speaker display name
  speaker_avatar_url  text,               -- speaker avatar image URL
  min_tier_level      int NOT NULL DEFAULT 0,
  is_published        bool NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Event RSVPs
-- =============================================================================

CREATE TABLE event_rsvps (
  user_id   uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  event_id  uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  rsvped_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- =============================================================================
-- 3. Indexes
-- PostgreSQL does NOT auto-index FK columns.
-- =============================================================================

-- Events
CREATE INDEX idx_events_starts_at ON events (starts_at DESC);
CREATE INDEX idx_events_published ON events (is_published) WHERE is_published = true;

-- Event RSVPs
CREATE INDEX idx_event_rsvps_event ON event_rsvps (event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps (user_id);

-- =============================================================================
-- 4. RLS — Events
-- =============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_published" ON events
  FOR SELECT TO authenticated
  USING (is_published = true);

-- No INSERT/UPDATE/DELETE — managed via service role (admin CMS)

-- =============================================================================
-- 5. RLS — Event RSVPs
-- =============================================================================

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rsvps_select_authenticated" ON event_rsvps
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "event_rsvps_insert_owner_tier" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      SELECT p.tier_level >= e.min_tier_level
      FROM profiles p, events e
      WHERE p.id = (SELECT auth.uid()) AND e.id = event_id
    )
  );

CREATE POLICY "event_rsvps_delete_owner" ON event_rsvps
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "event_rsvps_update_deny" ON event_rsvps
  FOR UPDATE TO authenticated USING (false);
