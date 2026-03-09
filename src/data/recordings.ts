export interface Recording {
  title: string;
  description: string;
  date: string;
  dateAdded: number;
  duration: string;
  durationMinutes: number;
  topic: string;
  categories: string[];
  speaker: string;
  avatar: string;
  views: number;
  gradient: string;
}

const gradients = [
  "from-[hsl(195,100%,35%)] to-[hsl(210,90%,45%)]",
  "from-[hsl(250,70%,45%)] to-[hsl(280,60%,50%)]",
  "from-[hsl(160,65%,35%)] to-[hsl(195,80%,40%)]",
  "from-[hsl(340,70%,45%)] to-[hsl(20,80%,50%)]",
  "from-[hsl(30,80%,45%)] to-[hsl(45,90%,50%)]",
  "from-[hsl(195,90%,40%)] to-[hsl(250,70%,50%)]",
  "from-[hsl(270,60%,50%)] to-[hsl(310,70%,55%)]",
  "from-[hsl(140,60%,35%)] to-[hsl(170,70%,40%)]",
];

const g = (i: number) => gradients[i % gradients.length];

export const initialRecordings: Recording[] = [
  // --- עדן ביבס ---
  { title: "מבוא לעולם ה-AI — מאיפה מתחילים?", description: "הרצאה מקיפה למתחילים על עולם הבינה המלאכותית, מושגים בסיסיים וכלים ראשונים", date: "8 בפבר 2026", dateAdded: 20260208, duration: "1:15 שעות", durationMinutes: 75, topic: "AI", categories: ["בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 1240, gradient: g(0) },
  { title: "וייב קודינג — בניית אפליקציה עם AI", description: "סדנה מעשית לבניית אפליקציה מלאה רק עם כלי AI, בלי ניסיון בתכנות", date: "5 בפבר 2026", dateAdded: 20260205, duration: "1:30 שעות", durationMinutes: 90, topic: "Vibe Coding", categories: ["Vibe Coding"], speaker: "עדן ביבס", avatar: "eden", views: 980, gradient: g(1) },
  { title: "אוטומציות חכמות לעסק שלך", description: "איך להפוך תהליכים ידניים לאוטומטיים עם Make ו-Zapier ובינה מלאכותית", date: "30 בינו 2026", dateAdded: 20260130, duration: "1:10 שעות", durationMinutes: 70, topic: "אוטומציות", categories: ["אוטומציות", "בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 870, gradient: g(2) },
  { title: "איך ליצור תוכן ויראלי עם AI", description: "שיטות מוכחות ליצירת תוכן ויראלי ברשתות חברתיות בעזרת כלי AI", date: "25 בינו 2026", dateAdded: 20260125, duration: "55 דק׳", durationMinutes: 55, topic: "תוכן", categories: ["ליוצרי תוכן"], speaker: "עדן ביבס", avatar: "eden", views: 1530, gradient: g(3) },
  { title: "שאלות ותשובות חודשי — ינואר 2026", description: "מפגש Q&A פתוח עם עדן — שאלות מהקהילה על כלי AI, עסקים ואוטומציות", date: "20 בינו 2026", dateAdded: 20260120, duration: "1:00 שעות", durationMinutes: 60, topic: "Q&A", categories: ["בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 650, gradient: g(4) },
  { title: "בניית צ׳אטבוט מכירות עם AI", description: "מדריך שלב-אחר-שלב לבניית בוט מכירות אוטומטי שמגדיל הכנסות", date: "15 בינו 2026", dateAdded: 20260115, duration: "1:20 שעות", durationMinutes: 80, topic: "צ׳אטבוטים", categories: ["אוטומציות", "בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 1100, gradient: g(5) },

  // --- מרצים אחרים ---
  { title: "בניית צ׳אטבוטים חכמים עם Sendpulse", description: "סדנה מעשית לבניית צ׳אטבוט מאפס — כולל אינטגרציות, תרחישים עסקיים וטיפים מהשטח", date: "4 בפבר 2026", dateAdded: 20260204, duration: "1:23 שעות", durationMinutes: 83, topic: "צ׳אטבוטים", categories: ["אוטומציות", "בעלי עסקים"], speaker: "גיל מ.", avatar: "gil", views: 342, gradient: g(6) },
  { title: "צלילה עמוקה ל-Prompt Engineering", description: "טכניקות מתקדמות לכתיבת פרומפטים — Chain of Thought, Few-Shot ועוד", date: "1 בפבר 2026", dateAdded: 20260201, duration: "58 דק׳", durationMinutes: 58, topic: "פרומפטינג", categories: ["בעלי עסקים", "ליוצרי תוכן"], speaker: "שרי ר.", avatar: "sari", views: 891, gradient: g(7) },
  { title: "כלי AI לעסקים קטנים", description: "סקירה מקיפה של כלי AI חינמיים ובתשלום שיכולים לשנות את העסק שלכם", date: "28 בינו 2026", dateAdded: 20260128, duration: "1:10 שעות", durationMinutes: 70, topic: "עסקים", categories: ["בעלי עסקים"], speaker: "דוד ל.", avatar: "david", views: 567, gradient: g(0) },
  { title: "אוטומציה בלי קוד עם AI", description: "איך לבנות תהליכי עבודה אוטומטיים עם Make, Zapier וכלי AI — בלי שורת קוד אחת", date: "22 בינו 2026", dateAdded: 20260122, duration: "45 דק׳", durationMinutes: 45, topic: "No-Code", categories: ["אוטומציות"], speaker: "מאיה ר.", avatar: "maya", views: 430, gradient: g(1) },
  { title: "יצירת אמנות AI: מדריך מעשי", description: "מ-Midjourney ל-DALL-E — מדריך מעשי ליצירת ויזואלים מרהיבים עם AI", date: "18 בינו 2026", dateAdded: 20260118, duration: "1:05 שעות", durationMinutes: 65, topic: "יצירתי", categories: ["יצירת תמונות"], speaker: "אלכס ב.", avatar: "alex", views: 215, gradient: g(2) },
  { title: "למידת מכונה למתחילים", description: "מבוא מקיף ללמידת מכונה — מושגי יסוד, אלגוריתמים ויישומים מעשיים", date: "12 בינו 2026", dateAdded: 20260112, duration: "1:30 שעות", durationMinutes: 90, topic: "ML", categories: ["בעלי עסקים"], speaker: "לי ברקוביץ", avatar: "iti", views: 780, gradient: g(3) },
  { title: "כתיבת תוכן שיווקי עם ChatGPT", description: "איך לכתוב פוסטים, מיילים ומודעות ברמה גבוהה בעזרת ChatGPT", date: "10 בינו 2026", dateAdded: 20260110, duration: "50 דק׳", durationMinutes: 50, topic: "תוכן", categories: ["ליוצרי תוכן", "בעלי עסקים"], speaker: "נועה כ.", avatar: "noa", views: 920, gradient: g(4) },
  { title: "Cursor AI — הכלי שישנה לכם את הקוד", description: "סקירה מעמיקה של Cursor AI לכתיבת קוד מהירה ואיכותית", date: "7 בינו 2026", dateAdded: 20260107, duration: "1:15 שעות", durationMinutes: 75, topic: "Vibe Coding", categories: ["Vibe Coding"], speaker: "רון ד.", avatar: "ron", views: 1350, gradient: g(5) },
  { title: "אוטומציות עם n8n — מעבר ל-Make", description: "למה n8n הופך לפלטפורמת האוטומציה המועדפת ואיך לעבור אליו", date: "3 בינו 2026", dateAdded: 20260103, duration: "1:00 שעות", durationMinutes: 60, topic: "אוטומציות", categories: ["אוטומציות"], speaker: "אורי ש.", avatar: "ori", views: 480, gradient: g(6) },
  { title: "מונטיזציה של תוכן AI", description: "מודלים עסקיים ושיטות להרוויח כסף מתוכן שנוצר עם AI", date: "30 בדצמ 2025", dateAdded: 20251230, duration: "55 דק׳", durationMinutes: 55, topic: "עסקים", categories: ["ליוצרי תוכן", "בעלי עסקים"], speaker: "תמר א.", avatar: "tamar", views: 710, gradient: g(7) },
  { title: "Lovable — בניית אתרים מלאים עם AI", description: "סדנה מעשית לבניית אתרים ואפליקציות עם Lovable ללא ידע בקוד", date: "25 בדצמ 2025", dateAdded: 20251225, duration: "1:25 שעות", durationMinutes: 85, topic: "Vibe Coding", categories: ["Vibe Coding", "בעלי עסקים"], speaker: "יעל ג.", avatar: "yael", views: 1680, gradient: g(0) },
  { title: "סטוריטלינג עם AI — איך לספר סיפורים", description: "שימוש בכלי AI ליצירת נרטיבים משכנעים לשיווק ומותג", date: "20 בדצמ 2025", dateAdded: 20251220, duration: "40 דק׳", durationMinutes: 40, topic: "תוכן", categories: ["ליוצרי תוכן"], speaker: "מיכל ת.", avatar: "michal", views: 325, gradient: g(1) },
  { title: "בניית קורס דיגיטלי עם AI", description: "מדריך מלא ליצירת קורס אונליין — מתוכן, דרך עיצוב ועד מכירות", date: "15 בדצמ 2025", dateAdded: 20251215, duration: "1:10 שעות", durationMinutes: 70, topic: "עסקים", categories: ["בעלי עסקים", "ליוצרי תוכן"], speaker: "עדן ביבס", avatar: "eden", views: 960, gradient: g(2) },
  { title: "AI לניהול פרויקטים", description: "כלים ושיטות לשילוב AI בניהול משימות, צוותים ופרויקטים", date: "10 בדצמ 2025", dateAdded: 20251210, duration: "48 דק׳", durationMinutes: 48, topic: "עסקים", categories: ["בעלי עסקים"], speaker: "אמיר ב.", avatar: "amir", views: 390, gradient: g(3) },
  { title: "Bolt ו-Replit — השוואת כלי וייב קודינג", description: "השוואה מעמיקה בין Bolt, Replit Agent וכלים נוספים לבניית אפליקציות עם AI", date: "5 בדצמ 2025", dateAdded: 20251205, duration: "1:00 שעות", durationMinutes: 60, topic: "Vibe Coding", categories: ["Vibe Coding"], speaker: "רון ד.", avatar: "ron", views: 820, gradient: g(4) },
  { title: "אימייל מרקטינג אוטומטי עם AI", description: "בניית מערך אימיילים אוטומטי עם תוכן מותאם אישית בעזרת AI", date: "1 בדצמ 2025", dateAdded: 20251201, duration: "52 דק׳", durationMinutes: 52, topic: "אוטומציות", categories: ["אוטומציות", "בעלי עסקים"], speaker: "נועה כ.", avatar: "noa", views: 540, gradient: g(5) },
  { title: "עיצוב גרפי עם AI — Canva ומעבר", description: "איך ליצור עיצובים מקצועיים בלי מעצב — כלי AI לעיצוב גרפי", date: "26 בנוב 2025", dateAdded: 20251126, duration: "45 דק׳", durationMinutes: 45, topic: "יצירתי", categories: ["יצירת תמונות"], speaker: "אלכס ב.", avatar: "alex", views: 670, gradient: g(6) },
  { title: "SEO עם AI — קידום אתרים חכם", description: "שימוש בכלי AI לחקר מילות מפתח, כתיבת תוכן ואופטימיזציה לגוגל", date: "20 בנוב 2025", dateAdded: 20251120, duration: "1:05 שעות", durationMinutes: 65, topic: "שיווק", categories: ["בעלי עסקים", "ליוצרי תוכן"], speaker: "דוד ל.", avatar: "david", views: 730, gradient: g(7) },
  { title: "Claude ו-ChatGPT — למי מתאים מה?", description: "השוואה מעמיקה בין שני מודלי ה-AI המובילים ומתי להשתמש בכל אחד", date: "15 בנוב 2025", dateAdded: 20251115, duration: "50 דק׳", durationMinutes: 50, topic: "AI", categories: ["בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 1890, gradient: g(0) },
  { title: "בניית MVP עם וייב קודינג", description: "איך לבנות מוצר מינימלי עובד ביום אחד עם כלי AI לקידוד", date: "10 בנוב 2025", dateAdded: 20251110, duration: "1:20 שעות", durationMinutes: 80, topic: "Vibe Coding", categories: ["Vibe Coding", "בעלי עסקים"], speaker: "יעל ג.", avatar: "yael", views: 1050, gradient: g(1) },
  { title: "פודקאסט עם AI — מההקלטה לעריכה", description: "כלי AI לעריכת פודקאסטים, תמלול, ויצירת קליפים מתוך פרקים", date: "5 בנוב 2025", dateAdded: 20251105, duration: "38 דק׳", durationMinutes: 38, topic: "תוכן", categories: ["ליוצרי תוכן", "יצירת סרטונים"], speaker: "מיכל ת.", avatar: "michal", views: 290, gradient: g(2) },
  { title: "הכנסה פסיבית עם כלי AI", description: "מודלים ליצירת הכנסה פסיבית בעזרת אוטומציות ותוכן שנוצר עם AI", date: "1 בנוב 2025", dateAdded: 20251101, duration: "1:00 שעות", durationMinutes: 60, topic: "עסקים", categories: ["בעלי עסקים"], speaker: "תמר א.", avatar: "tamar", views: 1420, gradient: g(3) },
  { title: "אוטומציית רשתות חברתיות", description: "איך לתזמן, ליצור ולנתח תוכן ברשתות חברתיות אוטומטית עם AI", date: "25 באוק 2025", dateAdded: 20251025, duration: "47 דק׳", durationMinutes: 47, topic: "אוטומציות", categories: ["אוטומציות", "ליוצרי תוכן"], speaker: "אורי ש.", avatar: "ori", views: 580, gradient: g(4) },
  { title: "Midjourney v7 — מה חדש?", description: "סקירה מלאה של הגרסה החדשה של Midjourney ואיך להשתמש בה", date: "20 באוק 2025", dateAdded: 20251020, duration: "55 דק׳", durationMinutes: 55, topic: "יצירתי", categories: ["יצירת תמונות"], speaker: "אלכס ב.", avatar: "alex", views: 940, gradient: g(5) },
  { title: "שירות לקוחות אוטומטי עם AI", description: "בניית מערכת שירות לקוחות חכמה עם צ׳אטבוטים ואוטומציות", date: "15 באוק 2025", dateAdded: 20251015, duration: "1:15 שעות", durationMinutes: 75, topic: "צ׳אטבוטים", categories: ["אוטומציות", "בעלי עסקים"], speaker: "גיל מ.", avatar: "gil", views: 620, gradient: g(6) },
  { title: "מבוא ל-Python עם AI", description: "למידת Python דרך כלי AI — למתחילים מוחלטים שרוצים להבין קוד", date: "10 באוק 2025", dateAdded: 20251010, duration: "1:30 שעות", durationMinutes: 90, topic: "Vibe Coding", categories: ["Vibe Coding"], speaker: "לי ברקוביץ", avatar: "iti", views: 450, gradient: g(7) },
  { title: "כתיבת ספר עם AI", description: "מדריך מלא לכתיבת ספר — מרעיון, דרך מבנה ועד פרסום — בעזרת AI", date: "5 באוק 2025", dateAdded: 20251005, duration: "1:10 שעות", durationMinutes: 70, topic: "תוכן", categories: ["ליוצרי תוכן"], speaker: "שרי ר.", avatar: "sari", views: 830, gradient: g(0) },
  { title: "ניתוח נתונים עם AI לבעלי עסקים", description: "איך להפוך דאטה לתובנות עסקיות בעזרת כלי AI פשוטים", date: "1 באוק 2025", dateAdded: 20251001, duration: "1:00 שעות", durationMinutes: 60, topic: "עסקים", categories: ["בעלי עסקים"], speaker: "אמיר ב.", avatar: "amir", views: 510, gradient: g(1) },
  { title: "סרטוני Reels ו-TikTok עם AI", description: "יצירת סרטונים קצרים ומעניינים לרשתות חברתיות בעזרת כלי AI", date: "25 בספט 2025", dateAdded: 20250925, duration: "42 דק׳", durationMinutes: 42, topic: "תוכן", categories: ["יצירת סרטונים", "ליוצרי תוכן"], speaker: "מיכל ת.", avatar: "michal", views: 1150, gradient: g(2) },
  { title: "בניית דף נחיתה עם AI בשעה", description: "מדריך מעשי לבניית דף נחיתה מקצועי תוך שעה עם כלי וייב קודינג", date: "20 בספט 2025", dateAdded: 20250920, duration: "58 דק׳", durationMinutes: 58, topic: "Vibe Coding", categories: ["Vibe Coding", "בעלי עסקים"], speaker: "עדן ביבס", avatar: "eden", views: 1320, gradient: g(3) },
];
