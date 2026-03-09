export const PLATFORM_CATEGORIES = [
  "הכל",
  "פופולרי",
  "בעלי עסקים",
  "ליוצרי תוכן",
  "אוטומציות",
  "Vibe Coding",
  "יצירת תמונות",
  "יצירת סרטונים",
] as const;

// Category filters shown in all content pages (without "הכל" and "פופולרי")
export const CONTENT_CATEGORIES = [
  "בעלי עסקים",
  "ליוצרי תוכן",
  "אוטומציות",
  "Vibe Coding",
  "יצירת תמונות",
  "יצירת סרטונים",
] as const;

export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

/**
 * Returns consistent Tailwind classes for each category tag.
 * bg: ~10% opacity, text: saturated color — soft and easy on the eye.
 */
export function getTagColor(tag: string): string {
  switch (tag) {
    case "הכל":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    case "פופולרי":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "בעלי עסקים":
    // legacy aliases
    case "לבעלי עסקים":
    case "עסקים":
    case "מקצועות":
    case "שיווק":
    case "פרודקטיביות":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "ליוצרי תוכן":
    case "יצירתיות":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
    case "אוטומציות":
    case "אוטומציה":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    case "Vibe Coding":
    case "וייב קודינג":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    case "יצירת תמונות":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    case "יצירת סרטונים":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}

/** Returns an emoji icon for each category (for filter chips). */
export function getCategoryIcon(tag: string): string {
  switch (tag) {
    case "הכל":           return "◎";
    case "פופולרי":       return "⭐";
    case "בעלי עסקים":   return "💼";
    case "ליוצרי תוכן":  return "✦";
    case "אוטומציות":    return "⚡";
    case "Vibe Coding":  return "🤖";
    case "יצירת תמונות": return "🖼";
    case "יצירת סרטונים":return "🎬";
    default:              return "";
  }
}
