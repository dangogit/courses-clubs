import { describe, it, expect } from "vitest";
import { extractMentions, hasMentions } from "@/lib/mentions";

describe("extractMentions", () => {
  it("returns empty array when there are no mentions", () => {
    expect(extractMentions("hello world")).toEqual([]);
  });

  it('extracts a single two-word Hebrew mention "@דוד לוי"', () => {
    expect(extractMentions("שלום @דוד לוי מה קורה")).toEqual(["דוד לוי"]);
  });

  it("extracts multiple single-word mentions", () => {
    expect(extractMentions("@alice @bob")).toEqual(["alice", "bob"]);
  });

  it("extracts two-word Hebrew name followed by other text", () => {
    expect(extractMentions("@שרי רוזנוסר wow")).toEqual(["שרי רוזנוסר"]);
  });

  it("extracts mention at end of string", () => {
    expect(extractMentions("hello @name")).toEqual(["name"]);
  });

  it("deduplicates repeated mentions", () => {
    // Both @alice captures produce "alice there" and "alice again" — different.
    // Use newline-separated identical mentions for true dedup:
    expect(extractMentions("@alice\n@alice")).toEqual(["alice"]);
  });

  it("works correctly when called multiple times (global regex lastIndex reset)", () => {
    expect(extractMentions("@alice")).toEqual(["alice"]);
    expect(extractMentions("@bob")).toEqual(["bob"]);
  });
});

describe("hasMentions", () => {
  it("returns true when mentions exist", () => {
    expect(hasMentions("hello @alice")).toBe(true);
  });

  it("returns false when no mentions exist", () => {
    expect(hasMentions("hello world")).toBe(false);
  });

  it("works correctly when called multiple times (global regex lastIndex reset)", () => {
    expect(hasMentions("@alice")).toBe(true);
    expect(hasMentions("no mentions")).toBe(false);
    expect(hasMentions("@bob")).toBe(true);
  });
});
