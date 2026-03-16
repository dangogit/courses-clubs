import { describe, it, expect } from "vitest";
import { generateICS } from "../calendar";
import type { CalendarEvent } from "../calendar";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    title: "Test Event",
    description: "A test description",
    startTime: new Date("2026-02-04T18:30:00Z"),
    endTime: new Date("2026-02-04T20:00:00Z"),
    ...overrides,
  };
}

/** Parse an ICS string into a key-value map (last value wins for dupes). */
function parseICSLines(ics: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of ics.split("\r\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    map.set(line.slice(0, colonIdx), line.slice(colonIdx + 1));
  }
  return map;
}

describe("generateICS", () => {
  it("returns valid iCalendar structure", () => {
    const ics = generateICS(makeEvent());

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("uses CRLF line endings per RFC 5545", () => {
    const ics = generateICS(makeEvent());

    // Every line break should be \r\n
    expect(ics).toContain("\r\n");
    // No bare \n without preceding \r (except escaped \\n in content)
    const withoutEscaped = ics.replace(/\\n/g, "");
    const bareNewlines = withoutEscaped.split("\r\n").join("").includes("\n");
    expect(bareNewlines).toBe(false);
  });

  it("formats dates as UTC YYYYMMDDTHHMMSSZ", () => {
    const fields = parseICSLines(generateICS(makeEvent()));

    expect(fields.get("DTSTART")).toBe("20260204T183000Z");
    expect(fields.get("DTEND")).toBe("20260204T200000Z");
  });

  it("includes SUMMARY and DESCRIPTION", () => {
    const fields = parseICSLines(generateICS(makeEvent()));

    expect(fields.get("SUMMARY")).toBe("Test Event");
    expect(fields.get("DESCRIPTION")).toBe("A test description");
  });

  it("includes location when provided", () => {
    const ics = generateICS(makeEvent({ location: "Zoom" }));
    const fields = parseICSLines(ics);

    expect(fields.get("LOCATION")).toBe("Zoom");
  });

  it("omits location when not provided", () => {
    const ics = generateICS(makeEvent());

    expect(ics).not.toContain("LOCATION:");
  });

  it("includes URL when provided", () => {
    const url = "https://zoom.us/j/123456";
    const ics = generateICS(makeEvent({ url }));
    const fields = parseICSLines(ics);

    expect(fields.get("URL")).toBe(url);
  });

  it("omits URL when not provided", () => {
    const ics = generateICS(makeEvent());

    expect(ics).not.toContain("URL:");
  });

  it("escapes commas in text fields", () => {
    const ics = generateICS(
      makeEvent({ title: "Hello, World", description: "One, Two, Three" })
    );
    const fields = parseICSLines(ics);

    expect(fields.get("SUMMARY")).toBe("Hello\\, World");
    expect(fields.get("DESCRIPTION")).toBe("One\\, Two\\, Three");
  });

  it("escapes semicolons in text fields", () => {
    const ics = generateICS(makeEvent({ title: "A; B; C" }));
    const fields = parseICSLines(ics);

    expect(fields.get("SUMMARY")).toBe("A\\; B\\; C");
  });

  it("escapes newlines in text fields", () => {
    const ics = generateICS(
      makeEvent({ description: "Line 1\nLine 2\r\nLine 3" })
    );
    const fields = parseICSLines(ics);

    expect(fields.get("DESCRIPTION")).toBe("Line 1\\nLine 2\\nLine 3");
  });

  it("escapes backslashes in text fields", () => {
    const ics = generateICS(makeEvent({ title: "path\\to\\file" }));
    const fields = parseICSLines(ics);

    expect(fields.get("SUMMARY")).toBe("path\\\\to\\\\file");
  });

  it("includes STATUS:CONFIRMED", () => {
    const ics = generateICS(makeEvent());

    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("includes PRODID for Brainers Club", () => {
    const ics = generateICS(makeEvent());

    expect(ics).toContain("PRODID:-//Brainers Club//Events//HE");
  });

  it("handles midnight UTC correctly", () => {
    const event = makeEvent({
      startTime: new Date("2026-01-01T00:00:00Z"),
      endTime: new Date("2026-01-01T01:00:00Z"),
    });
    const fields = parseICSLines(generateICS(event));

    expect(fields.get("DTSTART")).toBe("20260101T000000Z");
    expect(fields.get("DTEND")).toBe("20260101T010000Z");
  });
});
