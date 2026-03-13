import { describe, it, expect } from "vitest";
import { levels, getLevel } from "../levels";

describe("levels data", () => {
  it("has 15 levels", () => {
    expect(levels).toHaveLength(15);
  });

  it("levels are sorted by ascending xp (min)", () => {
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].min).toBeGreaterThan(levels[i - 1].min);
    }
  });

  it("first level starts at 0 xp", () => {
    expect(levels[0].min).toBe(0);
  });
});

describe("getLevel", () => {
  it("returns rank 1 for 0 points", () => {
    const result = getLevel(0);
    expect(result.rank).toBe(1);
    expect(result.name).toBe("מתעניין");
  });

  it("returns rank 4 for exactly 500 points", () => {
    const result = getLevel(500);
    expect(result.rank).toBe(4);
    expect(result.name).toBe("משתתף פעיל");
  });

  it("returns rank 15 for max level points", () => {
    const result = getLevel(15000);
    expect(result.rank).toBe(15);
    expect(result.progress).toBe(100);
  });

  it("handles points above max level", () => {
    const result = getLevel(99999);
    expect(result.rank).toBe(15);
    expect(result.progress).toBe(100);
    expect(result.pointsToNext).toBe(0);
  });

  it("calculates progress between levels correctly", () => {
    // Level 2 starts at 100, level 3 starts at 250 — midpoint is 175
    const result = getLevel(175);
    expect(result.rank).toBe(2);
    expect(result.progress).toBe(50);
  });

  it("has pointsToNext = 0 at max level", () => {
    const result = getLevel(15000);
    expect(result.pointsToNext).toBe(0);
    expect(result.nextLvl).toBeUndefined();
  });

  it("reports correct pointsToNext", () => {
    const result = getLevel(0);
    expect(result.pointsToNext).toBe(100); // next level is at 100
  });
});
