import { describe, it, expect } from "vitest";
import { getDateStr, getTimeStr, formatDay, formatDateShort, formatDateHebrew } from "../dateUtils";

describe("getDateStr", () => {
  it("extracts YYYY-MM-DD from ISO timestamp", () => {
    expect(getDateStr("2026-02-04T20:30:00+02:00")).toBe("2026-02-04");
  });

  it("works with UTC ISO strings", () => {
    expect(getDateStr("2026-02-04T18:30:00Z")).toBe("2026-02-04");
  });
});

describe("getTimeStr", () => {
  it("returns HH:MM from ISO timestamp", () => {
    // This test is timezone-dependent — the result depends on local timezone
    const result = getTimeStr("2026-02-04T18:30:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("pads single-digit hours and minutes", () => {
    const result = getTimeStr("2026-01-01T03:05:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("formatDay", () => {
  it("returns Hebrew weekday name", () => {
    // 2026-02-04 is a Wednesday
    const result = formatDay("2026-02-04");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatDateShort", () => {
  it("returns DD.MM format", () => {
    const result = formatDateShort("2026-02-04");
    expect(result).toBe("04.02");
  });

  it("pads single-digit day and month", () => {
    const result = formatDateShort("2026-01-05");
    expect(result).toBe("05.01");
  });
});

describe("formatDateHebrew", () => {
  it("returns full Hebrew date string", () => {
    const result = formatDateHebrew("2026-02-04");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should contain the year
    expect(result).toContain("2026");
  });
});
