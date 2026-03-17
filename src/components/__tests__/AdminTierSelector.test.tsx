import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminTierSelector } from "../AdminTierSelector";
import { useTiers } from "@/hooks/useTiers";

// Mock useTiers as a vi.fn so we can override per test
vi.mock("@/hooks/useTiers", () => ({
  useTiers: vi.fn(),
}));

const mockUseTiers = vi.mocked(useTiers);

beforeEach(() => {
  // Default: return empty data (fallback to TIER_META)
  mockUseTiers.mockReturnValue({ data: undefined } as ReturnType<typeof useTiers>);
});

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

  it("does NOT call onTierChange when disabled", () => {
    const onChange = vi.fn();
    renderWithQuery(
      <AdminTierSelector currentTierLevel={0} onTierChange={onChange} disabled />
    );
    fireEvent.click(screen.getByText("פרימיום"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets aria-pressed correctly on selected and unselected buttons", () => {
    renderWithQuery(
      <AdminTierSelector currentTierLevel={1} onTierChange={() => {}} />
    );
    // "בסיסי" (level 1) is selected
    expect(screen.getByText("בסיסי")).toHaveAttribute("aria-pressed", "true");
    // Others are not selected
    expect(screen.getByText("חינם")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("פרימיום")).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking inherited option sends level -1", () => {
    const onChange = vi.fn();
    renderWithQuery(
      <AdminTierSelector currentTierLevel={0} onTierChange={onChange} showInherited />
    );
    fireEvent.click(screen.getByText("ירושה"));
    expect(onChange).toHaveBeenCalledWith(-1);
  });
});

// Separate describe for DB-loaded tiers (non-fallback path)
describe("AdminTierSelector with DB tiers", () => {
  it("renders tier names from DB data instead of TIER_META fallback", () => {
    mockUseTiers.mockReturnValue({
      data: [
        { id: "t1", level: 0, name: "Free", color: "120 60% 40%", created_at: "" },
        { id: "t2", level: 1, name: "Basic", color: "195 100% 42%", created_at: "" },
        { id: "t3", level: 2, name: "Pro", color: "45 100% 50%", created_at: "" },
      ],
    } as ReturnType<typeof useTiers>);

    renderWithQuery(
      <AdminTierSelector currentTierLevel={0} onTierChange={() => {}} />
    );

    // Should use DB names, not TIER_META Hebrew names
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByText("חינם")).not.toBeInTheDocument();
  });
});
