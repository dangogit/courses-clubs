import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LockOverlay } from "../LockOverlay";

describe("LockOverlay", () => {
  it("renders nothing when user has access", () => {
    const { container } = render(
      <LockOverlay requiredTierLevel={1} userTierLevel={2} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders card overlay when user lacks access", () => {
    render(
      <LockOverlay requiredTierLevel={2} userTierLevel={0} />
    );
    expect(screen.getByText("פרימיום")).toBeInTheDocument();
  });

  it("renders detail variant with upgrade link", () => {
    render(
      <LockOverlay requiredTierLevel={1} userTierLevel={0} variant="detail" />
    );
    expect(screen.getByText("שדרגו")).toBeInTheDocument();
    expect(screen.getByText(/תוכן זה דורש מנוי/)).toBeInTheDocument();
  });

  it("renders nothing when userTierLevel equals requiredTierLevel (boundary)", () => {
    const { container } = render(
      <LockOverlay requiredTierLevel={1} userTierLevel={1} />
    );
    // canAccess(1, 1) → 1 >= 1 → true → render null
    expect(container.innerHTML).toBe("");
  });

  it("falls back to TIER_META[PREMIUM] for unknown tier level", () => {
    render(
      <LockOverlay requiredTierLevel={99} userTierLevel={0} />
    );
    // TIER_META[99] is undefined, so falls back to TIER_META[TIER_LEVELS.PREMIUM]
    // which has name "פרימיום"
    expect(screen.getByText("פרימיום")).toBeInTheDocument();
  });

  it("detail variant has role='status' and aria-label containing the tier name", () => {
    render(
      <LockOverlay requiredTierLevel={2} userTierLevel={0} variant="detail" />
    );
    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute(
      "aria-label",
      "תוכן נעול — נדרש מנוי פרימיום"
    );
  });

  it("card variant has role='status' and aria-label containing the tier name", () => {
    render(
      <LockOverlay requiredTierLevel={1} userTierLevel={0} variant="card" />
    );
    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute(
      "aria-label",
      "תוכן נעול — נדרש מנוי בסיסי"
    );
  });

  it("upgrade link href points to /subscription", () => {
    render(
      <LockOverlay requiredTierLevel={2} userTierLevel={0} variant="detail" />
    );
    const link = screen.getByRole("link", { name: /שדרגו/ });
    expect(link).toHaveAttribute("href", "/subscription");
  });

  it("card variant has aria-hidden='true' on Lock icon", () => {
    const { container } = render(
      <LockOverlay requiredTierLevel={2} userTierLevel={0} variant="card" />
    );
    // Lucide renders SVG with aria-hidden attribute
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
