-- Phase 2: Recordings library — table, RLS policies, and indexes
-- Extends docs/schema.md with UI-required columns (speaker, duration_minutes, view_count, order_index)

-- =============================================================================
-- 1. Recordings table
-- =============================================================================

CREATE TABLE recordings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  video_url        text,
  thumbnail_url    text,
  duration_label   text,
  duration_minutes int,
  speaker          text,
  speaker_avatar   text,
  recorded_at      date,
  tags             text[] NOT NULL DEFAULT '{}',
  view_count       int NOT NULL DEFAULT 0,
  min_tier_level   int NOT NULL DEFAULT 0,
  order_index      int NOT NULL DEFAULT 0 UNIQUE,
  is_published     bool NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX idx_recordings_order ON recordings (order_index);
CREATE INDEX idx_recordings_published ON recordings (is_published) WHERE is_published = true;
CREATE INDEX idx_recordings_tags ON recordings USING GIN (tags);

-- =============================================================================
-- 3. RLS policies
-- =============================================================================

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read published recordings
CREATE POLICY "recordings_select_authenticated" ON recordings
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies — managed via service role only
