-- Phase 2: Learning platform — courses, lessons, lesson_progress
-- Tables, RLS policies, and indexes for the learning module

-- =============================================================================
-- 1. Courses table
-- =============================================================================

CREATE TABLE courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  thumbnail_url   text,
  tag             text,
  duration_label  text,
  min_tier_level  int NOT NULL DEFAULT 0,
  order_index     int NOT NULL DEFAULT 0 UNIQUE,
  is_published    bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Lessons table
-- =============================================================================

CREATE TABLE lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES courses ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  bunny_video_id  text,
  duration_label  text,
  min_tier_level  int DEFAULT NULL,
  order_index     int NOT NULL DEFAULT 0,
  is_published    bool NOT NULL DEFAULT false
);

-- =============================================================================
-- 3. Lesson progress table
-- =============================================================================

CREATE TABLE lesson_progress (
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES lessons ON DELETE CASCADE,
  completed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- =============================================================================
-- 4. Indexes
-- =============================================================================

CREATE INDEX idx_courses_order ON courses (order_index);
CREATE UNIQUE INDEX idx_lessons_course_order ON lessons (course_id, order_index);
CREATE INDEX idx_lesson_progress_user ON lesson_progress (user_id);

-- =============================================================================
-- 5. RLS policies — courses
-- =============================================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_authenticated" ON courses
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for courses — managed via service role only

-- =============================================================================
-- 6. RLS policies — lessons
-- =============================================================================

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_authenticated" ON lessons
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for lessons — managed via service role only

-- =============================================================================
-- 7. RLS policies — lesson_progress
-- =============================================================================

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_progress_select_owner" ON lesson_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_insert_owner" ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_progress_delete_owner" ON lesson_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE — progress is toggled via INSERT/DELETE only
CREATE POLICY "lesson_progress_update_deny" ON lesson_progress
  FOR UPDATE TO authenticated
  USING (false);
