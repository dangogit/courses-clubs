const promptImg = "/assets/groups/prompt-engineering.jpg";
const bizImg = "/assets/groups/ai-business.jpg";
const chatImg = "/assets/groups/chatbots.jpg";
const artImg = "/assets/groups/ai-design.jpg";
const mlImg = "/assets/groups/machine-learning.jpg";
const nocodeImg = "/assets/groups/nocode-ai.jpg";

export interface Group {
  id: string;
  name: string;
  members: number;
  type: "public" | "private";
  description: string;
  longDescription: string;
  posts: number;
  cover: string;
  leader: { name: string; avatar: string; role: string };
}

export const groups: Group[] = [
  {
    id: "prompt",
    name: "Prompt Engineering",
    members: 843,
    type: "public",
    description: "שליטה באמנות הפרומפטינג – למדו לכתוב פרומפטים שמביאים תוצאות מדהימות",
    longDescription: "הקבוצה הזו מוקדשת לכל מי שרוצה לשלוט באמנות הפרומפטינג. כאן נלמד טכניקות מתקדמות כמו Chain of Thought, Few-Shot Learning, ועוד שיטות שיעזרו לכם לקבל תוצאות מדהימות מכל מודל שפה. נשתף דוגמאות, טיפים ותבניות מוכנות.",
    posts: 128,
    cover: promptImg,
    leader: { name: "לי ברקוביץ", avatar: "iti", role: "מומחה פרומפטינג" },
  },
  {
    id: "biz",
    name: "AI לעסקים",
    members: 612,
    type: "public",
    description: "יישום AI בתהליכי עבודה עסקיים – אוטומציה, חיסכון בזמן והגדלת הכנסות",
    longDescription: "קבוצה ליזמים, מנהלים ובעלי עסקים שרוצים לשלב AI בעבודה היומיומית. נדבר על אוטומציה של תהליכים, שימוש ב-AI לשיווק, מכירות, שירות לקוחות וניהול – הכל עם דוגמאות מעשיות ותוצאות אמיתיות.",
    posts: 94,
    cover: bizImg,
    leader: { name: "שרי רוזנוסר", avatar: "sari", role: "יועצת אסטרטגיית AI" },
  },
  {
    id: "chat",
    name: "בוני צ׳אטבוטים",
    members: 456,
    type: "public",
    description: "בניית צ׳אטבוטים חכמים מאפס – מ-GPT בסיסי ועד סוכני AI מתקדמים",
    longDescription: "הקבוצה לכל מי שבונה או רוצה לבנות צ׳אטבוטים וסוכני AI. נלמד איך לחבר API-ים, לבנות לוגיקת שיחה, לאמן מודלים על מידע ספציפי ולפרוס בוטים שמשרתים אלפי משתמשים.",
    posts: 76,
    cover: chatImg,
    leader: { name: "דוד לוי", avatar: "david", role: "מפתח צ׳אטבוטים" },
  },
  {
    id: "art",
    name: "AI ועיצוב",
    members: 321,
    type: "public",
    description: "כלי AI יצירתיים, יצירת תמונות, וידאו ועיצוב גרפי עם בינה מלאכותית",
    longDescription: "קבוצה ליוצרים ומעצבים שמשתמשים ב-AI לעיצוב. נשתף טכניקות ב-Midjourney, DALL-E, Stable Diffusion, כלי וידאו AI, ועוד. מושלם למי שרוצה לשלב יצירתיות עם טכנולוגיה.",
    posts: 63,
    cover: artImg,
    leader: { name: "מאיה רוזן", avatar: "maya", role: "מעצבת AI" },
  },
  {
    id: "ml",
    name: "למידת מכונה מתקדמת",
    members: 198,
    type: "private",
    description: "צלילה עמוקה לעולם ה-ML – מודלים, אימון ופריסה בפרודקשן",
    longDescription: "קבוצה למתקדמים שרוצים לצלול לעומק של למידת מכונה. נדבר על ארכיטקטורות מודלים, Fine-Tuning, MLOps, ופריסה בענן. ידע בתכנות מומלץ אבל לא חובה.",
    posts: 41,
    cover: mlImg,
    leader: { name: "אמיר כהן", avatar: "amir", role: "מהנדס ML" },
  },
  {
    id: "nocode",
    name: "No-Code AI",
    members: 567,
    type: "public",
    description: "AI בלי לכתוב שורת קוד – כלים, אוטומציות ופלטפורמות לכולם",
    longDescription: "הקבוצה לכל מי שרוצה להשתמש ב-AI בלי לגעת בקוד. נלמד על פלטפורמות No-Code כמו Make, Zapier, Bubble ועוד, ואיך לבנות אוטומציות חזקות שחוסכות שעות עבודה בלי ידע טכני.",
    posts: 109,
    cover: nocodeImg,
    leader: { name: "נועה שמיר", avatar: "noa", role: "מומחית No-Code" },
  },
];

// Mock posts per group
export const groupPosts: Record<string, Array<{
  id: number;
  author: string;
  avatar: string;
  role: string | null;
  time: string;
  pinned: boolean;
  content: string;
  likes: number;
  comments: number;
}>> = {
  prompt: [
    { id: 1, author: "לי ברקוביץ", avatar: "iti", role: "מוביל קבוצה", time: "לפני שעה", pinned: true, content: "חברים, הנה תבנית פרומפט מטורפת ל-Chain of Thought שמשפרת תשובות ב-80%! 🔥\n\nשלב 1: הגדירו את ההקשר\nשלב 2: תנו דוגמה\nשלב 3: בקשו ניתוח שלב-אחר-שלב\n\nנסו ותספרו מה קיבלתם!", likes: 34, comments: 18 },
    { id: 2, author: "רון דוידוב", avatar: "ron1", role: null, time: "לפני 3 שעות", pinned: false, content: "גיליתי שאם מוסיפים \"Think step by step\" בסוף הפרומפט, האיכות משתפרת משמעותית. מישהו עוד שם לב לזה?", likes: 12, comments: 6 },
    { id: 3, author: "תמר אלון", avatar: "tamar1", role: null, time: "לפני 5 שעות", pinned: false, content: "שיתוף: בניתי ספריית פרומפטים לשיווק דיגיטלי — כוללת 50 תבניות מוכנות. מי רוצה שאשתף?", likes: 28, comments: 15 },
  ],
  biz: [
    { id: 1, author: "שרי רוזנוסר", avatar: "sari", role: "מובילת קבוצה", time: "לפני 2 שעות", pinned: true, content: "חיסכנו 40 שעות עבודה בחודש בזכות אוטומציית AI לשירות לקוחות! הנה בדיוק מה עשינו ואיך:", likes: 45, comments: 22 },
    { id: 2, author: "יוסי מזרחי", avatar: "yossi1", role: null, time: "לפני 4 שעות", pinned: false, content: "מישהו ניסה להשתמש ב-AI לכתיבת הצעות מחיר? מחפש כלי שמתממשק עם ה-CRM שלנו", likes: 8, comments: 11 },
  ],
  chat: [
    { id: 1, author: "דוד לוי", avatar: "david", role: "מוביל קבוצה", time: "לפני שעה", pinned: true, content: "מדריך חדש: איך לבנות צ׳אטבוט שמתחבר ל-WhatsApp ב-30 דקות! 🤖\nקישור למדריך המלא בתגובה הראשונה", likes: 52, comments: 31 },
    { id: 2, author: "אור בן דוד", avatar: "or1", role: null, time: "לפני 6 שעות", pinned: false, content: "הבוט שלי עונה ב-3 שפות עכשיו! שיתוף הקונפיגורציה בפנים 🌍", likes: 19, comments: 7 },
  ],
  art: [
    { id: 1, author: "מאיה רוזן", avatar: "maya", role: "מובילת קבוצה", time: "לפני 3 שעות", pinned: true, content: "אתגר שבועי 🎨: צרו תמונה בסגנון Art Nouveau עם Midjourney v6. שתפו את התוצאות כאן!", likes: 38, comments: 24 },
    { id: 2, author: "ליאור פרידמן", avatar: "lior1", role: null, time: "לפני 5 שעות", pinned: false, content: "ויבו קודינג + AI ארט = שילוב מטורף. הנה הפרויקט שיצרתי", likes: 27, comments: 9 },
  ],
  ml: [
    { id: 1, author: "אמיר כהן", avatar: "amir", role: "מוביל קבוצה", time: "לפני 4 שעות", pinned: true, content: "סדרת הרצאות חדשה: Fine-Tuning מודלים בפרודקשן 🧠\nשיעור ראשון ביום שלישי ב-20:00. הרשמה בקישור!", likes: 21, comments: 14 },
  ],
  nocode: [
    { id: 1, author: "נועה שמיר", avatar: "noa", role: "מובילת קבוצה", time: "לפני 2 שעות", pinned: true, content: "בניתי אפליקציה שלמה בלי שורת קוד אחת! 🚀\nהשתמשתי ב-Lovable + Make + GPT-4. הנה הסרטון המלא:", likes: 61, comments: 33 },
    { id: 2, author: "גל שפירא", avatar: "gal1", role: null, time: "לפני 5 שעות", pinned: false, content: "מי מכיר תחליף טוב ל-Zapier? מחפש משהו יותר זול עם אינטגרציות דומות", likes: 14, comments: 19 },
  ],
};
