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

-- =============================================================================
-- Courses (matches src/data/courses.ts)
-- =============================================================================

INSERT INTO courses (title, description, tag, duration_label, min_tier_level, order_index, is_published) VALUES
  ('יסודות AI',                   'למדו את הבסיס של בינה מלאכותית ולמידת מכונה',           'פופולרי', '6 שעות',  0, 0, true),
  ('שליטה ב-Prompt Engineering',  'שלטו באמנות כתיבת פרומפטים אפקטיביים',                 'חדש',     '4 שעות',  0, 1, true),
  ('בניית צ׳אטבוטים חכמים',       'צרו צ׳אטבוטים חכמים ליישומים עסקיים',                  NULL,      '8 שעות',  0, 2, true),
  ('AI לשיווק דיגיטלי',           'נצלו כלי AI להצלחה בשיווק דיגיטלי',                    NULL,      '5 שעות',  0, 3, true),
  ('כלי No-Code AI',              'השתמשו ב-AI חזק בלי לכתוב שורת קוד',                   'הושלם',   '3 שעות',  0, 4, true),
  ('למידת מכונה מתקדמת',          'צלילה עמוקה לאלגוריתמים ורשתות נוירונים',               'מתקדם',   '12 שעות', 0, 5, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Lessons (matches src/data/courses.ts lesson arrays)
-- Uses a CTE to look up course IDs by title
-- =============================================================================

DO $$
DECLARE
  c_id uuid;
BEGIN

-- Course 0: יסודות AI
SELECT id INTO c_id FROM courses WHERE order_index = 0 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'מהי בינה מלאכותית?',           'מבוא לעולם ה-AI – היסטוריה, הגדרות ומושגי יסוד',       '25 דק׳', 0, true),
  (c_id, 'סוגי למידת מכונה',             'למידה מפוקחת, לא מפוקחת וחיזוקית',                     '30 דק׳', 1, true),
  (c_id, 'רשתות נוירונים – הבסיס',       'איך עובדת רשת נוירונים פשוטה',                          '35 דק׳', 2, true),
  (c_id, 'עיבוד שפה טבעית (NLP)',        'איך מכונות מבינות טקסט ושפה',                           '30 דק׳', 3, true),
  (c_id, 'ראייה ממוחשבת',                'זיהוי תמונות, עצמים ופנים',                              '28 דק׳', 4, true),
  (c_id, 'כלי AI פופולריים',             'סקירת כלים: ChatGPT, Claude, Midjourney ועוד',          '25 דק׳', 5, true),
  (c_id, 'פרומפטים בסיסיים',             'איך לכתוב פרומפט טוב ולקבל תוצאות מדויקות',            '30 דק׳', 6, true),
  (c_id, 'AI בעסקים',                    'יישומים עסקיים של בינה מלאכותית',                       '35 דק׳', 7, true),
  (c_id, 'אתיקה ב-AI',                  'סוגיות מוסריות והטיות באלגוריתמים',                     '20 דק׳', 8, true),
  (c_id, 'אוטומציה עם AI',              'זרימות עבודה אוטומטיות בעזרת AI',                       '30 דק׳', 9, true),
  (c_id, 'פרויקט מעשי – חלק א׳',        'בניית פתרון AI פשוט מאפס',                              '40 דק׳', 10, true),
  (c_id, 'פרויקט מעשי – חלק ב׳',        'השלמת הפרויקט והצגתו',                                  '32 דק׳', 11, true);

-- Course 1: שליטה ב-Prompt Engineering
SELECT id INTO c_id FROM courses WHERE order_index = 1 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'מבוא ל-Prompt Engineering',    'מה זה PE ולמה זה חשוב',                                '25 דק׳', 0, true),
  (c_id, 'מבנה פרומפט אפקטיבי',         'רכיבי הפרומפט: הקשר, תפקיד, פורמט',                   '30 דק׳', 1, true),
  (c_id, 'טכניקות Chain of Thought',     'חשיבה שלב-אחר-שלב לתוצאות מדויקות',                   '35 דק׳', 2, true),
  (c_id, 'Few-Shot Prompting',           'שימוש בדוגמאות לכיוון המודל',                           '28 דק׳', 3, true),
  (c_id, 'פרומפטים ליצירת תוכן',         'כתיבת תוכן שיווקי, בלוגים ומיילים',                    '30 דק׳', 4, true),
  (c_id, 'פרומפטים לניתוח נתונים',       'שאילתות מורכבות לניתוח מידע',                           '32 דק׳', 5, true),
  (c_id, 'פרומפטים לקוד',               'כתיבת קוד, דיבאגינג ורפקטורינג עם AI',                  '30 דק׳', 6, true),
  (c_id, 'טעויות נפוצות ואיך להימנע',    'הטעויות הגדולות ביותר ותיקונן',                         '25 דק׳', 7, true);

-- Course 2: בניית צ׳אטבוטים חכמים
SELECT id INTO c_id FROM courses WHERE order_index = 2 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'מבוא לצ׳אטבוטים',             'סוגי צ׳אטבוטים ושימושים עסקיים',                       '25 דק׳', 0, true),
  (c_id, 'בחירת פלטפורמה',              'השוואת כלים: Botpress, Voiceflow, Chatfuel',            '30 דק׳', 1, true),
  (c_id, 'עיצוב שיחה',                  'עקרונות UX לשיחות אנושיות',                              '35 דק׳', 2, true),
  (c_id, 'חיבור למקורות מידע',           'RAG – שליפת מידע רלוונטי',                               '40 דק׳', 3, true),
  (c_id, 'אינטגרציות',                  'חיבור לוואטסאפ, אתר ורשתות חברתיות',                    '30 דק׳', 4, true),
  (c_id, 'בדיקות ואופטימיזציה',          'איך לבדוק ולשפר את הבוט',                               '28 דק׳', 5, true),
  (c_id, 'אבטחה ופרטיות',               'הגנה על מידע ומניעת prompt injection',                   '25 דק׳', 6, true),
  (c_id, 'מדידת הצלחה',                 'KPIs ומטריקות לצ׳אטבוט',                                '30 דק׳', 7, true),
  (c_id, 'סקיילינג',                    'ניהול בוט בסקייל גדול',                                  '32 דק׳', 8, true),
  (c_id, 'בוט שירות לקוחות – חלק א׳',   'פרויקט מעשי: בניית בוט מאפס',                           '40 דק׳', 9, true),
  (c_id, 'בוט שירות לקוחות – חלק ב׳',   'השלמה, בדיקות והשקה',                                   '35 דק׳', 10, true),
  (c_id, 'בוט מכירות',                  'בניית בוט שמניע לידים ומכירות',                          '35 דק׳', 11, true),
  (c_id, 'בוט פנים-ארגוני',             'אוטומציה של תהליכים פנימיים',                            '30 דק׳', 12, true),
  (c_id, 'טרנדים עתידיים',              'לאן הולך עולם הצ׳אטבוטים',                              '25 דק׳', 13, true),
  (c_id, 'סיכום ומבט קדימה',            'חזרה על הנלמד וצעדים הבאים',                             '20 דק׳', 14, true);

-- Course 3: AI לשיווק דיגיטלי
SELECT id INTO c_id FROM courses WHERE order_index = 3 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'AI בשיווק – סקירה כללית',      'איך AI משנה את עולם השיווק',                            '25 דק׳', 0, true),
  (c_id, 'יצירת תוכן עם AI',            'כתיבת פוסטים, מיילים ומודעות',                          '35 דק׳', 1, true),
  (c_id, 'ניתוח קהלי יעד',              'שימוש ב-AI לפילוח ואיתור קהלים',                        '30 דק׳', 2, true),
  (c_id, 'אופטימיזציית קמפיינים',        'שיפור ביצועים בזמן אמת עם AI',                          '30 דק׳', 3, true),
  (c_id, 'AI ל-SEO',                     'מחקר מילות מפתח ואופטימיזציה',                          '28 דק׳', 4, true),
  (c_id, 'צ׳אטבוטים שיווקיים',           'המרת לידים דרך שיחות אוטומטיות',                       '30 דק׳', 5, true),
  (c_id, 'AI לעיצוב ויזואלי',            'יצירת תמונות, וידאו ובאנרים',                           '32 דק׳', 6, true),
  (c_id, 'אוטומציות שיווקיות',           'זרימות עבודה אוטומטיות מקצה לקצה',                     '30 דק׳', 7, true),
  (c_id, 'ניתוח דאטה שיווקי',            'הפקת תובנות מנתוני קמפיינים',                           '25 דק׳', 8, true),
  (c_id, 'אסטרטגיית AI לשיווק',         'בניית תוכנית עבודה שנתית',                              '25 דק׳', 9, true);

-- Course 4: כלי No-Code AI
SELECT id INTO c_id FROM courses WHERE order_index = 4 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'מהו No-Code AI?',             'הגדרות ויתרונות הגישה',                                 '20 דק׳', 0, true),
  (c_id, 'Zapier + AI',                 'אוטומציות חכמות ללא קוד',                               '35 דק׳', 1, true),
  (c_id, 'Make (Integromat)',            'בניית תהליכים מורכבים',                                  '30 דק׳', 2, true),
  (c_id, 'Bubble + AI Plugins',         'בניית אפליקציות עם AI מובנה',                            '35 דק׳', 3, true),
  (c_id, 'כלים נוספים',                 'Airtable, Notion AI, Gamma ועוד',                       '25 דק׳', 4, true),
  (c_id, 'פרויקט סיום',                 'בניית אוטומציה שלמה מאפס',                              '35 דק׳', 5, true);

-- Course 5: למידת מכונה מתקדמת
SELECT id INTO c_id FROM courses WHERE order_index = 5 LIMIT 1;
INSERT INTO lessons (course_id, title, description, duration_label, order_index, is_published) VALUES
  (c_id, 'חזרה על יסודות ML',           'רענון מושגי בסיס',                                      '30 דק׳', 0, true),
  (c_id, 'רגרסיה מתקדמת',              'מודלים לא-ליניאריים ורגולריזציה',                        '35 דק׳', 1, true),
  (c_id, 'עצי החלטה ו-Random Forest',   'אנסמבלים ובוסטינג',                                     '40 דק׳', 2, true),
  (c_id, 'SVM ו-Kernel Methods',        'מרחבים רב-ממדיים וסיווג',                                '35 דק׳', 3, true),
  (c_id, 'רשתות CNN',                   'קונבולוציה לעיבוד תמונות',                               '40 דק׳', 4, true),
  (c_id, 'רשתות RNN ו-LSTM',            'עיבוד סדרות זמן וטקסט',                                 '40 דק׳', 5, true),
  (c_id, 'Transformers',                'הארכיטקטורה מאחורי GPT ו-BERT',                         '45 דק׳', 6, true),
  (c_id, 'Transfer Learning',           'שימוש במודלים מאומנים מראש',                             '30 דק׳', 7, true),
  (c_id, 'GANs',                        'רשתות יריבות ליצירת תוכן',                               '35 דק׳', 8, true),
  (c_id, 'Reinforcement Learning',      'למידה מחיזוקים ומשחקים',                                '40 דק׳', 9, true),
  (c_id, 'MLOps',                       'ניהול מודלים בפרודקשן',                                  '35 דק׳', 10, true),
  (c_id, 'Fine-Tuning מודלים',          'התאמת מודלים לצרכים ספציפיים',                           '40 דק׳', 11, true),
  (c_id, 'RAG מתקדם',                   'שליפה ויצירה משולבת',                                    '35 דק׳', 12, true),
  (c_id, 'הערכת מודלים',                'מטריקות, validation ובדיקות',                            '30 דק׳', 13, true),
  (c_id, 'אתיקה ב-ML',                 'הטיות, הוגנות ושקיפות',                                  '25 דק׳', 14, true),
  (c_id, 'פרויקט – חלק א׳',            'בניית pipeline מלא',                                     '45 דק׳', 15, true),
  (c_id, 'פרויקט – חלק ב׳',            'אימון ואופטימיזציה',                                     '40 דק׳', 16, true),
  (c_id, 'פרויקט – חלק ג׳',            'דיפלוי והצגה',                                           '35 דק׳', 17, true),
  (c_id, 'טרנדים ב-2026',              'מגמות חמות בתחום',                                       '30 דק׳', 18, true),
  (c_id, 'סיכום וצעדים הבאים',          'המשך למידה ומשאבים',                                    '25 דק׳', 19, true);

END $$;
