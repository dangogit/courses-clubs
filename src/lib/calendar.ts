/**
 * Calendar export utility — generates .ics (iCalendar RFC 5545) content
 * for single-event downloads. No external dependencies.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  url?: string;
}

/**
 * Format a Date to iCalendar UTC datetime: YYYYMMDDTHHMMSSZ
 */
function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Escape text per RFC 5545 section 3.3.11:
 * - Backslashes must be escaped first (before other replacements add them)
 * - Semicolons and commas are escaped with a preceding backslash
 * - Newlines become literal \n
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generate an .ics file content string for a single event.
 */
export function generateICS(event: CalendarEvent): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Brainers Club//Events//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatDateUTC(event.startTime)}`,
    `DTEND:${formatDateUTC(event.endTime)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");

  // RFC 5545 requires CRLF line endings
  return lines.join("\r\n");
}

/**
 * Trigger a browser download of the .ics file.
 * Creates a temporary Blob URL, clicks a hidden anchor, and cleans up.
 */
export function downloadICS(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? "event.ics";
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a tick to ensure the download starts
  requestAnimationFrame(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  });
}
