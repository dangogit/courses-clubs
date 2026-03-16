import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useReferralStats, useTopInviters } from "../useReferralStats";

// ── Mock Supabase ──

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
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

describe("useReferralStats", () => {
  it("returns empty stats when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useReferralStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalReferred).toBe(0);
    expect(result.current.data?.totalXP).toBe(0);
    expect(result.current.data?.friends).toEqual([]);
  });

  it("returns referral stats for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    // Mock referrals query
    mockFrom.mockImplementation((table: string) => {
      if (table === "referrals") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "r1", referred_id: "ref-1", reward_xp: 50, created_at: "2026-01-15T00:00:00Z" },
                  { id: "r2", referred_id: "ref-2", reward_xp: 50, created_at: "2026-01-10T00:00:00Z" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "ref-1", display_name: "Dana", avatar_url: null },
                { id: "ref-2", display_name: "Yossi", avatar_url: null },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useReferralStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalReferred).toBe(2);
    expect(result.current.data?.totalXP).toBe(100);
    expect(result.current.data?.friends).toHaveLength(2);
    expect(result.current.data?.friends[0].display_name).toBe("Dana");
  });

  it("returns empty friends when no referrals", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-789" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useReferralStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalReferred).toBe(0);
    expect(result.current.data?.friends).toEqual([]);
  });
});

describe("useTopInviters", () => {
  it("returns top inviters from RPC", async () => {
    const mockData = [
      { user_id: "u1", display_name: "Mark", avatar_url: null, referral_count: 34, total_xp: 1700 },
      { user_id: "u2", display_name: "Golan", avatar_url: null, referral_count: 28, total_xp: 1400 },
    ];
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useTopInviters(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].referral_count).toBe(34);
    expect(mockRpc).toHaveBeenCalledWith("get_top_inviters", { p_limit: 5 });
  });

  it("returns empty array when no inviters", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useTopInviters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
