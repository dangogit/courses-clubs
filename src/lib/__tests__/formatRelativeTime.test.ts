import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

const NOW = new Date("2026-03-16T12:00:00Z");

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "עכשיו" for dates less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe("עכשיו");
  });

  it('returns "עכשיו" for the current moment', () => {
    expect(formatRelativeTime(NOW.toISOString())).toBe("עכשיו");
  });

  it('returns "לפני X דקות" for minutes ago', () => {
    const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("לפני 5 דקות");
  });

  it('returns "לפני 1 דקות" for exactly 1 minute ago', () => {
    const oneMinuteAgo = new Date(NOW.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(oneMinuteAgo)).toBe("לפני 1 דקות");
  });

  it('returns "לפני שעה" for exactly 1 hour ago', () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toBe("לפני שעה");
  });

  it('returns "לפני X שעות" for multiple hours ago', () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("לפני 3 שעות");
  });

  it('returns "לפני יום" for exactly 1 day ago', () => {
    const oneDayAgo = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe("לפני יום");
  });

  it('returns "לפני X ימים" for multiple days ago', () => {
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("לפני 3 ימים");
  });

  it('returns "לפני שבוע" for exactly 1 week ago', () => {
    const oneWeekAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneWeekAgo)).toBe("לפני שבוע");
  });

  it('returns "לפני X שבועות" for multiple weeks ago', () => {
    const twoWeeksAgo = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe("לפני 2 שבועות");
  });

  it("falls back to formatted date string for dates older than 4 weeks", () => {
    const twoMonthsAgo = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoMonthsAgo);
    // Should not contain "לפני" — it's a locale-formatted date
    expect(result).not.toContain("לפני");
    // Should contain a number (the day of the month)
    expect(result).toMatch(/\d/);
  });
});
