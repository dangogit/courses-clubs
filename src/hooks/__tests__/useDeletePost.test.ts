import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useDeletePost } from "../useDeletePost";

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
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useDeletePost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("post-1"); });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as Error).message).toBe("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("includes user_id filter in delete query", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const deleteChain: Record<string, unknown> = {};
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain);
    let eqCallCount = 0;
    deleteChain.eq = vi.fn().mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount >= 2) return Promise.resolve({ error: null });
      return deleteChain;
    });
    mockFrom.mockReturnValueOnce(deleteChain);

    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("post-1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteChain.eq).toHaveBeenCalledWith("id", "post-1");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
