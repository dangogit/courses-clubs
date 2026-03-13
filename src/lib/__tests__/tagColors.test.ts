import { describe, it, expect } from "vitest";
import {
  PLATFORM_CATEGORIES,
  CONTENT_CATEGORIES,
  DEFAULT_TAG_COLOR,
  getTagColor,
  getCategoryIcon,
} from "../tagColors";

describe("getTagColor", () => {
  it("returns a non-default color for each platform category", () => {
    for (const cat of PLATFORM_CATEGORIES) {
      if (cat === "הכל") continue; // "הכל" intentionally uses slate (same as default)
      expect(getTagColor(cat)).not.toBe(DEFAULT_TAG_COLOR);
    }
  });

  it("returns default slate for unknown tags", () => {
    expect(getTagColor("nonexistent-tag")).toBe(DEFAULT_TAG_COLOR);
  });

  it("maps legacy aliases to the same color as canonical", () => {
    expect(getTagColor("לבעלי עסקים")).toBe(getTagColor("בעלי עסקים"));
    expect(getTagColor("עסקים")).toBe(getTagColor("בעלי עסקים"));
    expect(getTagColor("אוטומציה")).toBe(getTagColor("אוטומציות"));
    expect(getTagColor("וייב קודינג")).toBe(getTagColor("Vibe Coding"));
  });

  it("CONTENT_CATEGORIES is PLATFORM_CATEGORIES without הכל and פופולרי", () => {
    const expected = PLATFORM_CATEGORIES.filter(
      (c) => c !== "הכל" && c !== "פופולרי"
    );
    expect([...CONTENT_CATEGORIES]).toEqual(expected);
  });
});

describe("getCategoryIcon", () => {
  it("returns a non-empty string for all platform categories", () => {
    for (const cat of PLATFORM_CATEGORIES) {
      expect(getCategoryIcon(cat).length).toBeGreaterThan(0);
    }
  });

  it("returns empty string for unknown tag", () => {
    expect(getCategoryIcon("unknown")).toBe("");
  });
});
