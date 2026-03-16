import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useGroups } from "../useGroups";

// ── Mock Supabase ──

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

// ── Helpers ──

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makeGroup(overrides: Record<string, unknown> = {}) {
  return {
    id: "group-1",
    name: "Test Group",
    description: "A test group",
    cover_url: null,
    min_tier_level: 0,
    created_at: "2026-01-01T00:00:00Z",
    group_members: [{ count: 5 }],
    ...overrides,
  };
}

// Builds a chained Supabase query mock
function chainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("useGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns groups with member counts on success", async () => {
    const groups = [
      makeGroup({ id: "g1", name: "Group A", group_members: [{ count: 12 }] }),
      makeGroup({ id: "g2", name: "Group B", group_members: [{ count: 3 }] }),
    ];
    const chain = chainMock(groups);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].id).toBe("g1");
    expect(result.current.data![0].memberCount).toBe(12);
    expect(result.current.data![1].id).toBe("g2");
    expect(result.current.data![1].memberCount).toBe(3);

    // Verify select includes the count subquery
    expect(chain.select).toHaveBeenCalledWith("*, group_members(count)");
    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("returns empty array when no groups", async () => {
    const chain = chainMock([]);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    const chain = chainMock(null);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("defaults memberCount to 0 when group_members is empty", async () => {
    const groups = [makeGroup({ id: "g1", group_members: [] })];
    const chain = chainMock(groups);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].memberCount).toBe(0);
  });

  it("throws on Supabase error", async () => {
    const chain = chainMock(null, { message: "DB error" });
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "DB error" });
  });
});
