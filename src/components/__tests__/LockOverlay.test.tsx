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
});
