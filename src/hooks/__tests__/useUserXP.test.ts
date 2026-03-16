import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useUserXP } from "../useUserXP";

// ── Mock Supabase ──

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
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

describe("useUserXP", () => {
  it("returns defaults when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useUserXP(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.xpTotal).toBe(0);
    expect(result.current.data?.levelId).toBe(1);
    expect(result.current.data?.level.name).toBe("מתעניין");
    expect(result.current.data?.displayName).toBeNull();
    expect(result.current.data?.avatarUrl).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns XP data and profile info for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { xp_total: 750, level_id: 4, display_name: "דניאל", avatar_url: "https://example.com/avatar.png" },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUserXP(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.xpTotal).toBe(750);
    expect(result.current.data?.levelId).toBe(4);
    // 750 XP should be level "משתתף פעיל" (min: 500, rank: 4)
    expect(result.current.data?.level.name).toBe("משתתף פעיל");
    expect(result.current.data?.level.rank).toBe(4);
    expect(result.current.data?.displayName).toBe("דניאל");
    expect(result.current.data?.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("returns defaults when profile query fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUserXP(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.xpTotal).toBe(0);
    expect(result.current.data?.levelId).toBe(1);
    expect(result.current.data?.displayName).toBeNull();
    expect(result.current.data?.avatarUrl).toBeNull();
  });

  it("calculates level progress correctly", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-789" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { xp_total: 300, level_id: 3, display_name: null, avatar_url: null },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUserXP(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // 300 XP: level "לומד מסור" (min: 250), next "משתתף פעיל" (min: 500)
    // progress = (300 - 250) / (500 - 250) * 100 = 20%
    expect(result.current.data?.level.progress).toBe(20);
    expect(result.current.data?.level.pointsToNext).toBe(200);
  });
});
