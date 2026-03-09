export interface Lesson {
  title: string;
  duration: string;
  description: string;
}

export interface Course {
  title: string;
  lessons: Lesson[];
  duration: string;
  
  progress: number;
  description: string;
  tag: string | null;
}

export const initialCourses: Course[] = [
  {
    title: "יסודות AI",
    duration: "6 שעות",
    
    progress: 75,
    description: "למדו את הבסיס של בינה מלאכותית ולמידת מכונה",
    tag: "פופולרי",
    lessons: [
      { title: "מהי בינה מלאכותית?", duration: "25 דק׳", description: "מבוא לעולם ה-AI – היסטוריה, הגדרות ומושגי יסוד" },
      { title: "סוגי למידת מכונה", duration: "30 דק׳", description: "למידה מפוקחת, לא מפוקחת וחיזוקית" },
      { title: "רשתות נוירונים – הבסיס", duration: "35 דק׳", description: "איך עובדת רשת נוירונים פשוטה" },
      { title: "עיבוד שפה טבעית (NLP)", duration: "30 דק׳", description: "איך מכונות מבינות טקסט ושפה" },
      { title: "ראייה ממוחשבת", duration: "28 דק׳", description: "זיהוי תמונות, עצמים ופנים" },
      { title: "כלי AI פופולריים", duration: "25 דק׳", description: "סקירת כלים: ChatGPT, Claude, Midjourney ועוד" },
      { title: "פרומפטים בסיסיים", duration: "30 דק׳", description: "איך לכתוב פרומפט טוב ולקבל תוצאות מדויקות" },
      { title: "AI בעסקים", duration: "35 דק׳", description: "יישומים עסקיים של בינה מלאכותית" },
      { title: "אתיקה ב-AI", duration: "20 דק׳", description: "סוגיות מוסריות והטיות באלגוריתמים" },
      { title: "אוטומציה עם AI", duration: "30 דק׳", description: "זרימות עבודה אוטומטיות בעזרת AI" },
      { title: "פרויקט מעשי – חלק א׳", duration: "40 דק׳", description: "בניית פתרון AI פשוט מאפס" },
      { title: "פרויקט מעשי – חלק ב׳", duration: "32 דק׳", description: "השלמת הפרויקט והצגתו" },
    ],
  },
  {
    title: "שליטה ב-Prompt Engineering",
    duration: "4 שעות",
    
    progress: 30,
    description: "שלטו באמנות כתיבת פרומפטים אפקטיביים",
    tag: "חדש",
    lessons: [
      { title: "מבוא ל-Prompt Engineering", duration: "25 דק׳", description: "מה זה PE ולמה זה חשוב" },
      { title: "מבנה פרומפט אפקטיבי", duration: "30 דק׳", description: "רכיבי הפרומפט: הקשר, תפקיד, פורמט" },
      { title: "טכניקות Chain of Thought", duration: "35 דק׳", description: "חשיבה שלב-אחר-שלב לתוצאות מדויקות" },
      { title: "Few-Shot Prompting", duration: "28 דק׳", description: "שימוש בדוגמאות לכיוון המודל" },
      { title: "פרומפטים ליצירת תוכן", duration: "30 דק׳", description: "כתיבת תוכן שיווקי, בלוגים ומיילים" },
      { title: "פרומפטים לניתוח נתונים", duration: "32 דק׳", description: "שאילתות מורכבות לניתוח מידע" },
      { title: "פרומפטים לקוד", duration: "30 דק׳", description: "כתיבת קוד, דיבאגינג ורפקטורינג עם AI" },
      { title: "טעויות נפוצות ואיך להימנע", duration: "25 דק׳", description: "הטעויות הגדולות ביותר ותיקונן" },
    ],
  },
  {
    title: "בניית צ׳אטבוטים חכמים",
    duration: "8 שעות",
    
    progress: 0,
    description: "צרו צ׳אטבוטים חכמים ליישומים עסקיים",
    tag: null,
    lessons: [
      { title: "מבוא לצ׳אטבוטים", duration: "25 דק׳", description: "סוגי צ׳אטבוטים ושימושים עסקיים" },
      { title: "בחירת פלטפורמה", duration: "30 דק׳", description: "השוואת כלים: Botpress, Voiceflow, Chatfuel" },
      { title: "עיצוב שיחה", duration: "35 דק׳", description: "עקרונות UX לשיחות אנושיות" },
      { title: "חיבור למקורות מידע", duration: "40 דק׳", description: "RAG – שליפת מידע רלוונטי" },
      { title: "אינטגרציות", duration: "30 דק׳", description: "חיבור לוואטסאפ, אתר ורשתות חברתיות" },
      { title: "בדיקות ואופטימיזציה", duration: "28 דק׳", description: "איך לבדוק ולשפר את הבוט" },
      { title: "אבטחה ופרטיות", duration: "25 דק׳", description: "הגנה על מידע ומניעת prompt injection" },
      { title: "מדידת הצלחה", duration: "30 דק׳", description: "KPIs ומטריקות לצ׳אטבוט" },
      { title: "סקיילינג", duration: "32 דק׳", description: "ניהול בוט בסקייל גדול" },
      { title: "בוט שירות לקוחות – חלק א׳", duration: "40 דק׳", description: "פרויקט מעשי: בניית בוט מאפס" },
      { title: "בוט שירות לקוחות – חלק ב׳", duration: "35 דק׳", description: "השלמה, בדיקות והשקה" },
      { title: "בוט מכירות", duration: "35 דק׳", description: "בניית בוט שמניע לידים ומכירות" },
      { title: "בוט פנים-ארגוני", duration: "30 דק׳", description: "אוטומציה של תהליכים פנימיים" },
      { title: "טרנדים עתידיים", duration: "25 דק׳", description: "לאן הולך עולם הצ׳אטבוטים" },
      { title: "סיכום ומבט קדימה", duration: "20 דק׳", description: "חזרה על הנלמד וצעדים הבאים" },
    ],
  },
  {
    title: "AI לשיווק דיגיטלי",
    duration: "5 שעות",
    
    progress: 0,
    description: "נצלו כלי AI להצלחה בשיווק דיגיטלי",
    tag: null,
    lessons: [
      { title: "AI בשיווק – סקירה כללית", duration: "25 דק׳", description: "איך AI משנה את עולם השיווק" },
      { title: "יצירת תוכן עם AI", duration: "35 דק׳", description: "כתיבת פוסטים, מיילים ומודעות" },
      { title: "ניתוח קהלי יעד", duration: "30 דק׳", description: "שימוש ב-AI לפילוח ואיתור קהלים" },
      { title: "אופטימיזציית קמפיינים", duration: "30 דק׳", description: "שיפור ביצועים בזמן אמת עם AI" },
      { title: "AI ל-SEO", duration: "28 דק׳", description: "מחקר מילות מפתח ואופטימיזציה" },
      { title: "צ׳אטבוטים שיווקיים", duration: "30 דק׳", description: "המרת לידים דרך שיחות אוטומטיות" },
      { title: "AI לעיצוב ויזואלי", duration: "32 דק׳", description: "יצירת תמונות, וידאו ובאנרים" },
      { title: "אוטומציות שיווקיות", duration: "30 דק׳", description: "זרימות עבודה אוטומטיות מקצה לקצה" },
      { title: "ניתוח דאטה שיווקי", duration: "25 דק׳", description: "הפקת תובנות מנתוני קמפיינים" },
      { title: "אסטרטגיית AI לשיווק", duration: "25 דק׳", description: "בניית תוכנית עבודה שנתית" },
    ],
  },
  {
    title: "כלי No-Code AI",
    duration: "3 שעות",
    
    progress: 100,
    description: "השתמשו ב-AI חזק בלי לכתוב שורת קוד",
    tag: "הושלם",
    lessons: [
      { title: "מהו No-Code AI?", duration: "20 דק׳", description: "הגדרות ויתרונות הגישה" },
      { title: "Zapier + AI", duration: "35 דק׳", description: "אוטומציות חכמות ללא קוד" },
      { title: "Make (Integromat)", duration: "30 דק׳", description: "בניית תהליכים מורכבים" },
      { title: "Bubble + AI Plugins", duration: "35 דק׳", description: "בניית אפליקציות עם AI מובנה" },
      { title: "כלים נוספים", duration: "25 דק׳", description: "Airtable, Notion AI, Gamma ועוד" },
      { title: "פרויקט סיום", duration: "35 דק׳", description: "בניית אוטומציה שלמה מאפס" },
    ],
  },
  {
    title: "למידת מכונה מתקדמת",
    duration: "12 שעות",
    
    progress: 0,
    description: "צלילה עמוקה לאלגוריתמים ורשתות נוירונים",
    tag: "מתקדם",
    lessons: [
      { title: "חזרה על יסודות ML", duration: "30 דק׳", description: "רענון מושגי בסיס" },
      { title: "רגרסיה מתקדמת", duration: "35 דק׳", description: "מודלים לא-ליניאריים ורגולריזציה" },
      { title: "עצי החלטה ו-Random Forest", duration: "40 דק׳", description: "אנסמבלים ובוסטינג" },
      { title: "SVM ו-Kernel Methods", duration: "35 דק׳", description: "מרחבים רב-ממדיים וסיווג" },
      { title: "רשתות CNN", duration: "40 דק׳", description: "קונבולוציה לעיבוד תמונות" },
      { title: "רשתות RNN ו-LSTM", duration: "40 דק׳", description: "עיבוד סדרות זמן וטקסט" },
      { title: "Transformers", duration: "45 דק׳", description: "הארכיטקטורה מאחורי GPT ו-BERT" },
      { title: "Transfer Learning", duration: "30 דק׳", description: "שימוש במודלים מאומנים מראש" },
      { title: "GANs", duration: "35 דק׳", description: "רשתות יריבות ליצירת תוכן" },
      { title: "Reinforcement Learning", duration: "40 דק׳", description: "למידה מחיזוקים ומשחקים" },
      { title: "MLOps", duration: "35 דק׳", description: "ניהול מודלים בפרודקשן" },
      { title: "Fine-Tuning מודלים", duration: "40 דק׳", description: "התאמת מודלים לצרכים ספציפיים" },
      { title: "RAG מתקדם", duration: "35 דק׳", description: "שליפה ויצירה משולבת" },
      { title: "הערכת מודלים", duration: "30 דק׳", description: "מטריקות, validation ובדיקות" },
      { title: "אתיקה ב-ML", duration: "25 דק׳", description: "הטיות, הוגנות ושקיפות" },
      { title: "פרויקט – חלק א׳", duration: "45 דק׳", description: "בניית pipeline מלא" },
      { title: "פרויקט – חלק ב׳", duration: "40 דק׳", description: "אימון ואופטימיזציה" },
      { title: "פרויקט – חלק ג׳", duration: "35 דק׳", description: "דיפלוי והצגה" },
      { title: "טרנדים ב-2026", duration: "30 דק׳", description: "מגמות חמות בתחום" },
      { title: "סיכום וצעדים הבאים", duration: "25 דק׳", description: "המשך למידה ומשאבים" },
    ],
  },
];
