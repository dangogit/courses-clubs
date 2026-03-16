import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminTierSelector } from "../AdminTierSelector";

// Mock useTiers to return empty (will use TIER_META fallback)
vi.mock("@/hooks/useTiers", () => ({
  useTiers: () => ({ data: undefined }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("AdminTierSelector", () => {
  it("renders 3 tier buttons", () => {
    renderWithQuery(
      <AdminTierSelector currentTierLevel={0} onTierChange={() => {}} />
    );
    expect(screen.getByText("חינם")).toBeInTheDocument();
    expect(screen.getByText("בסיסי")).toBeInTheDocument();
    expect(screen.getByText("פרימיום")).toBeInTheDocument();
  });

  it("renders inherited option when showInherited is true", () => {
    renderWithQuery(
      <AdminTierSelector currentTierLevel={-1} onTierChange={() => {}} showInherited />
    );
    expect(screen.getByText("ירושה")).toBeInTheDocument();
  });

  it("calls onTierChange when a tier is clicked", () => {
    const onChange = vi.fn();
    renderWithQuery(
      <AdminTierSelector currentTierLevel={0} onTierChange={onChange} />
    );
    fireEvent.click(screen.getByText("פרימיום"));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
