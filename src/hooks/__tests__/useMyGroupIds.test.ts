import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useMyGroupIds } from "../useMyGroupIds";

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function chainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("useMyGroupIds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns set of group IDs for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainMock([{ group_id: "g1" }, { group_id: "g2" }]);
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useMyGroupIds(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(new Set(["g1", "g2"]));
    expect(chain.select).toHaveBeenCalledWith("group_id");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns empty set when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useMyGroupIds(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(new Set());
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns empty set on error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainMock(null, { message: "DB error" });
    mockFrom.mockReturnValueOnce(chain);

    const { result } = renderHook(() => useMyGroupIds(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
