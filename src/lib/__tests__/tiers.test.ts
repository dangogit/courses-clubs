import { describe, it, expect } from "vitest";
import { canAccess, getEffectiveTierLevel, TIER_LEVELS, TIER_META } from "../tiers";

describe("canAccess", () => {
  it("returns true when user tier equals content tier", () => {
    expect(canAccess(0, 0)).toBe(true);
    expect(canAccess(1, 1)).toBe(true);
    expect(canAccess(2, 2)).toBe(true);
  });

  it("returns true when user tier exceeds content tier", () => {
    expect(canAccess(2, 0)).toBe(true);
    expect(canAccess(2, 1)).toBe(true);
    expect(canAccess(1, 0)).toBe(true);
  });

  it("returns false when user tier is below content tier", () => {
    expect(canAccess(0, 1)).toBe(false);
    expect(canAccess(0, 2)).toBe(false);
    expect(canAccess(1, 2)).toBe(false);
  });
});

describe("getEffectiveTierLevel", () => {
  it("returns lesson tier when explicitly set", () => {
    expect(getEffectiveTierLevel(0, 2)).toBe(0);
    expect(getEffectiveTierLevel(1, 0)).toBe(1);
    expect(getEffectiveTierLevel(2, 1)).toBe(2);
  });

  it("inherits course tier when lesson tier is null", () => {
    expect(getEffectiveTierLevel(null, 2)).toBe(2);
    expect(getEffectiveTierLevel(null, 0)).toBe(0);
  });

  it("inherits course tier when lesson tier is undefined", () => {
    expect(getEffectiveTierLevel(undefined, 1)).toBe(1);
    expect(getEffectiveTierLevel(undefined, 0)).toBe(0);
  });
});

describe("TIER_LEVELS", () => {
  it("has correct values", () => {
    expect(TIER_LEVELS.FREE).toBe(0);
    expect(TIER_LEVELS.BASIC).toBe(1);
    expect(TIER_LEVELS.PREMIUM).toBe(2);
  });
});

describe("TIER_META", () => {
  it("has metadata for all tier levels", () => {
    expect(TIER_META[0].name).toBe("חינם");
    expect(TIER_META[1].name).toBe("בסיסי");
    expect(TIER_META[2].name).toBe("פרימיום");
    expect(TIER_META[0].color).toBe("120 60% 40%");
  });
});
