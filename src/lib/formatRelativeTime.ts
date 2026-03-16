/**
 * Formats an ISO date string into Hebrew relative time (e.g., "לפני 3 שעות").
 */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return "עכשיו";
  if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`;
  if (diffHours < 24) return `לפני ${diffHours === 1 ? "שעה" : `${diffHours} שעות`}`;
  if (diffDays < 7) return `לפני ${diffDays === 1 ? "יום" : `${diffDays} ימים`}`;
  if (diffWeeks < 4) return `לפני ${diffWeeks === 1 ? "שבוע" : `${diffWeeks} שבועות`}`;

  return new Date(isoDate).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}
