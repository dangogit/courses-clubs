/** Format a date string (ISO or YYYY-MM-DD) to Hebrew locale */
export function formatHebDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}
