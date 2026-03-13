import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn (class name merge)", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles falsy values", () => {
    expect(cn("px-2", false && "hidden", undefined, null, "py-1")).toBe(
      "px-2 py-1"
    );
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("resolves conflicting background colors", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
