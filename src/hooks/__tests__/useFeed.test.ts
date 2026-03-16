import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useFeed } from "../useFeed";

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
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    user_id: "user-1",
    group_id: null,
    title: "Test Post",
    body: "Post body",
    image_url: null,
    is_pinned: false,
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    profiles: {
      id: "user-1",
      display_name: "Test User",
      avatar_url: null,
      role: "member",
    },
    post_comments: [{ count: 2 }],
    post_reactions: [
      { reaction_type: "like" },
      { reaction_type: "like" },
      { reaction_type: "heart" },
    ],
    ...overrides,
  };
}

/**
 * Creates a thenable chain mock that mimics the Supabase PostgREST builder.
 * Every method returns the chain itself. When `await`-ed (via `.then()`),
 * it resolves with `{ data, error }`.
 */
function thenableChain(data: unknown, error: unknown = null) {
  const resolved = { data, error };
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation(
    (onFulfilled?: (value: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled)
  );
  return chain;
}

describe("useFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
  });

  it("fetches main feed (groupId = null) with posts", async () => {
    const posts = [
      makePost({ id: "p1", created_at: "2026-01-02T00:00:00Z" }),
      makePost({ id: "p2", created_at: "2026-01-01T00:00:00Z" }),
    ];

    // 1st from("posts"): regular posts query
    const regularChain = thenableChain(posts);
    // 2nd from("posts"): pinned posts query (first page)
    const pinnedChain = thenableChain([]);
    // 3rd from("post_reactions"): user reactions
    const userReactionsChain = thenableChain([
      { post_id: "p1", reaction_type: "like" },
    ]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain)
      .mockReturnValueOnce(userReactionsChain);

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    expect(page.posts).toHaveLength(2);
    expect(page.posts[0].id).toBe("p1");
    expect(page.posts[0].author.display_name).toBe("Test User");
    expect(page.posts[0].commentCount).toBe(2);
    expect(page.posts[0].reactionCounts).toEqual({ like: 2, heart: 1 });
    expect(page.posts[0].userReactions).toEqual(["like"]);
    expect(page.posts[1].userReactions).toEqual([]);

    // Verify groupId=null uses .is("group_id", null) on both queries
    expect(regularChain.is).toHaveBeenCalledWith("group_id", null);
    expect(pinnedChain.is).toHaveBeenCalledWith("group_id", null);
  });

  it("fetches group feed (groupId = some-uuid)", async () => {
    const groupId = "group-uuid-123";
    const posts = [makePost({ id: "p1", group_id: groupId })];

    const regularChain = thenableChain(posts);
    const pinnedChain = thenableChain([]);
    const userReactionsChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain)
      .mockReturnValueOnce(userReactionsChain);

    const { result } = renderHook(() => useFeed(groupId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    expect(page.posts).toHaveLength(1);

    // Verify groupId is used with .eq() instead of .is()
    expect(regularChain.eq).toHaveBeenCalledWith("group_id", groupId);
    expect(pinnedChain.eq).toHaveBeenCalledWith("group_id", groupId);
    // .is should NOT have been called with "group_id"
    expect(regularChain.is).not.toHaveBeenCalledWith("group_id", null);
  });

  it("returns pinned posts on first page", async () => {
    const regularPosts = [
      makePost({ id: "p1", is_pinned: false }),
    ];
    const pinnedPosts = [
      makePost({
        id: "pinned-1",
        is_pinned: true,
        title: "Pinned Announcement",
      }),
    ];

    const regularChain = thenableChain(regularPosts);
    const pinnedChain = thenableChain(pinnedPosts);
    const userReactionsChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain)
      .mockReturnValueOnce(userReactionsChain);

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    // Pinned posts come first, then regular posts
    expect(page.posts).toHaveLength(2);
    expect(page.posts[0].id).toBe("pinned-1");
    expect(page.posts[1].id).toBe("p1");
  });

  it("returns empty feed when no posts", async () => {
    const regularChain = thenableChain([]);
    const pinnedChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain);
    // No reactions query since postIds is empty

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    expect(page.posts).toEqual([]);
    expect(page.nextCursor).toBeUndefined();
  });

  it("skips user reactions query when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const posts = [makePost({ id: "p1" })];
    const regularChain = thenableChain(posts);
    const pinnedChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain);

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    expect(page.posts).toHaveLength(1);
    expect(page.posts[0].userReactions).toEqual([]);

    // Only 2 from() calls (posts + pinned), no reactions query
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("returns nextCursor when page is full (PAGE_SIZE = 20)", async () => {
    // Create exactly 20 posts to trigger pagination
    const posts = Array.from({ length: 20 }, (_, i) =>
      makePost({
        id: `p${i}`,
        created_at: `2026-01-${String(20 - i).padStart(2, "0")}T00:00:00Z`,
        post_reactions: [],
      })
    );

    const regularChain = thenableChain(posts);
    const pinnedChain = thenableChain([]);
    const userReactionsChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain)
      .mockReturnValueOnce(userReactionsChain);

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const page = result.current.data!.pages[0];
    expect(page.posts).toHaveLength(20);
    expect(page.nextCursor).toBeDefined();
    expect(page.nextCursor!.id).toBe("p19");
    expect(page.nextCursor!.createdAt).toBe("2026-01-01T00:00:00Z");
  });

  it("returns no nextCursor when page is not full", async () => {
    const posts = [makePost({ id: "p1" })];

    const regularChain = thenableChain(posts);
    const pinnedChain = thenableChain([]);
    const userReactionsChain = thenableChain([]);

    mockFrom
      .mockReturnValueOnce(regularChain)
      .mockReturnValueOnce(pinnedChain)
      .mockReturnValueOnce(userReactionsChain);

    const { result } = renderHook(() => useFeed(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.pages[0].nextCursor).toBeUndefined();
  });
});
