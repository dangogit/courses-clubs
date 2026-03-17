import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useTiers } from "../useTiers";

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

function makeTier(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    level: 0,
    name: "Free",
    description: "Free tier",
    color: "#888888",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Builds a chained Supabase query mock
function chainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTiers", () => {
  it("returns tiers sorted by level", async () => {
    const tiers = [
      makeTier({ id: 1, level: 0, name: "Free" }),
      makeTier({ id: 2, level: 1, name: "Basic" }),
      makeTier({ id: 3, level: 2, name: "Premium" }),
    ];
    const chain = chainMock(tiers);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0].name).toBe("Free");
    expect(result.current.data![0].level).toBe(0);
    expect(result.current.data![1].name).toBe("Basic");
    expect(result.current.data![2].name).toBe("Premium");
    expect(chain.order).toHaveBeenCalledWith("level");
  });

  it("returns empty array when no tiers exist", async () => {
    mockFrom.mockReturnValueOnce(chainMock([]));

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockFrom.mockReturnValueOnce(chainMock(null));

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    mockFrom.mockReturnValueOnce(chainMock(null, { message: "DB error" }));

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "DB error" });
  });

  it("queries the tiers table", async () => {
    mockFrom.mockReturnValueOnce(chainMock([makeTier()]));

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("tiers");
  });
});
