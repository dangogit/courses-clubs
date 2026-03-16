import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useLeaderboard, useUserRank } from "../useLeaderboard";

// ── Mock Supabase ──

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useLeaderboard", () => {
  it("returns leaderboard data for weekly period", async () => {
    const mockData = [
      { rank: 1, user_id: "u1", display_name: "Alice", avatar_url: null, points: 200 },
      { rank: 2, user_id: "u2", display_name: "Bob", avatar_url: null, points: 150 },
    ];
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useLeaderboard("weekly"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].display_name).toBe("Alice");
    expect(result.current.data![0].points).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("get_leaderboard", { p_period: "weekly" });
  });

  it("returns empty array when no data", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useLeaderboard("alltime"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("throws on RPC error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const { result } = renderHook(() => useLeaderboard("monthly"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUserRank", () => {
  it("returns user rank and points", async () => {
    mockRpc.mockResolvedValue({
      data: [{ rank: 5, points: 120 }],
      error: null,
    });

    const { result } = renderHook(() => useUserRank("weekly"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rank).toBe(5);
    expect(result.current.data?.points).toBe(120);
  });

  it("returns null when user has no XP", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useUserRank("alltime"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
