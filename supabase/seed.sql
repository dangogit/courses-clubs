-- Seed data: 15 levels (matches src/data/levels.ts)
-- Applied once per club via `supabase db seed`

INSERT INTO levels (id, title, xp_required, icon, badge_url, color) VALUES
  (1,  'מתעניין',       0,      '🌱', NULL, NULL),
  (2,  'סקרן פעיל',     100,    '💪', NULL, NULL),
  (3,  'לומד מסור',     250,    '🤝', NULL, NULL),
  (4,  'משתתף פעיל',    500,    '⭐', NULL, NULL),
  (5,  'משתתף מתקדם',   1000,   '🎤', NULL, NULL),
  (6,  'מוביל ידע',     1500,   '🧠', NULL, NULL),
  (7,  'מומחה תוכן',    2000,   '🏆', NULL, NULL),
  (8,  'משתתף בולט',    2750,   '🎓', NULL, NULL),
  (9,  'מאסטר למידה',   4500,   '💎', NULL, NULL),
  (10, 'גורו קהילה',    6500,   '🔥', NULL, NULL),
  (11, 'אלוף השראה',    7500,   '✨', NULL, NULL),
  (12, 'אייקון מועדון',  8000,   '👑', NULL, NULL),
  (13, 'שגריר מועדון',   10000,  '🌟', NULL, NULL),
  (14, 'סופרנובה',      12500,  '🌠', NULL, NULL),
  (15, 'אגדה חיה',      15000,  '🦁', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
