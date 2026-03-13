import { describe, it, expect } from "vitest";
import { club } from "../club";

const HSL_PATTERN = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

describe("club config", () => {
  it("has required identity fields", () => {
    expect(club.name).toBeTruthy();
    expect(club.tagline).toBeTruthy();
    expect(club.logo).toBeTruthy();
  });

  it("HSL color values use bare format (no hsl() wrapper)", () => {
    for (const [key, value] of Object.entries(club.colors)) {
      expect(value, `colors.${key} should match "H S% L%" format`).toMatch(
        HSL_PATTERN
      );
    }
  });

  it("has all required color keys", () => {
    expect(club.colors).toHaveProperty("primary");
    expect(club.colors).toHaveProperty("primaryForeground");
    expect(club.colors).toHaveProperty("accent");
    expect(club.colors).toHaveProperty("accentForeground");
  });

  it("feature flags are booleans", () => {
    for (const [key, value] of Object.entries(club.features)) {
      expect(typeof value, `features.${key} should be boolean`).toBe(
        "boolean"
      );
    }
  });

  it("supportEmail looks like a valid email", () => {
    expect(club.supportEmail).toMatch(/.+@.+\..+/);
  });
});
