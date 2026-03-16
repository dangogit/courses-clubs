import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useToggleReaction } from "../useToggleReaction";

// ── Mock Supabase ──

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

// ── Helpers ──

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useToggleReaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { action: "removed" } when DELETE returns rows (reaction already existed)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // DELETE chain: .delete().eq().eq().eq().select() -> returns 1 deleted row
    const deleteChain: Record<string, unknown> = {};
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain);
    deleteChain.eq = vi.fn().mockReturnValue(deleteChain);
    deleteChain.select = vi.fn().mockResolvedValue({
      data: [{ id: "reaction-1", post_id: "post-1", user_id: "user-1", reaction_type: "like" }],
      error: null,
    });

    mockFrom.mockReturnValueOnce(deleteChain);

    const { result } = renderHook(() => useToggleReaction(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ postId: "post-1", reactionType: "like" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ action: "removed" });
    expect(deleteChain.eq).toHaveBeenCalledWith("post_id", "post-1");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(deleteChain.eq).toHaveBeenCalledWith("reaction_type", "like");
  });

  it('returns { action: "added" } when DELETE returns 0 rows (new reaction)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // DELETE chain: returns empty array (nothing to delete)
    const deleteChain: Record<string, unknown> = {};
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain);
    deleteChain.eq = vi.fn().mockReturnValue(deleteChain);
    deleteChain.select = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    // INSERT chain: successful insert
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockResolvedValue({ error: null });

    mockFrom
      .mockReturnValueOnce(deleteChain) // "post_reactions" for DELETE
      .mockReturnValueOnce(insertChain); // "post_reactions" for INSERT

    const { result } = renderHook(() => useToggleReaction(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ postId: "post-1", reactionType: "heart" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ action: "added" });
    expect(insertChain.insert).toHaveBeenCalledWith({
      post_id: "post-1",
      user_id: "user-1",
      reaction_type: "heart",
    });
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useToggleReaction(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ postId: "post-1", reactionType: "like" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Not authenticated");

    // Should never call from() if not authenticated
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when insert fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // DELETE chain: returns empty (nothing to delete)
    const deleteChain: Record<string, unknown> = {};
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain);
    deleteChain.eq = vi.fn().mockReturnValue(deleteChain);
    deleteChain.select = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    // INSERT chain: fails
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockResolvedValue({
      error: { message: "RLS violation" },
    });

    mockFrom
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useToggleReaction(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ postId: "post-1", reactionType: "like" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "RLS violation" });
  });
});
