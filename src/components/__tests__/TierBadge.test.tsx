import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierBadge } from "../TierBadge";

describe("TierBadge", () => {
  it("renders nothing for free tier by default", () => {
    const { container } = render(<TierBadge tierLevel={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders free badge when showFree is true", () => {
    render(<TierBadge tierLevel={0} showFree />);
    expect(screen.getByText("חינם")).toBeInTheDocument();
  });

  it("renders basic tier badge", () => {
    render(<TierBadge tierLevel={1} />);
    expect(screen.getByText("בסיסי")).toBeInTheDocument();
  });

  it("renders premium tier badge", () => {
    render(<TierBadge tierLevel={2} />);
    expect(screen.getByText("פרימיום")).toBeInTheDocument();
  });

  it("applies md size classes", () => {
    render(<TierBadge tierLevel={1} size="md" />);
    const badge = screen.getByText("בסיסי");
    expect(badge.className).toContain("text-xs");
  });

  it("falls back to TIER_META[PREMIUM] for unknown tier level", () => {
    // TierBadge: TIER_META[99] ?? TIER_META[TIER_LEVELS.PREMIUM]
    // TIER_META[99] is undefined, so falls back to Premium meta
    render(<TierBadge tierLevel={99} />);
    expect(screen.getByText("פרימיום")).toBeInTheDocument();
  });
});
