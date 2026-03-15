import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useRecordings, useRecording } from "../useRecordings";

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

function makeRecording(overrides: Record<string, unknown> = {}) {
  return {
    id: "rec-1",
    title: "Test Recording",
    description: "A test recording",
    video_url: null,
    thumbnail_url: null,
    duration_label: "1:00 שעות",
    duration_minutes: 60,
    speaker: "Test Speaker",
    speaker_avatar: "test",
    recorded_at: "2026-01-15",
    tags: ["בעלי עסקים"],
    view_count: 100,
    min_tier_level: 0,
    order_index: 0,
    is_published: true,
    created_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

// Builds a chained Supabase query mock for list queries
function chainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

// Builds a chained mock for single-row queries
function singleChainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("useRecordings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns published recordings ordered by order_index", async () => {
    const recordings = [
      makeRecording({ id: "r1", order_index: 0 }),
      makeRecording({ id: "r2", order_index: 1, title: "Second" }),
    ];
    mockFrom.mockReturnValueOnce(chainMock(recordings));

    const { result } = renderHook(() => useRecordings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].id).toBe("r1");
    expect(result.current.data![1].id).toBe("r2");
  });

  it("returns empty array when no recordings exist", async () => {
    mockFrom.mockReturnValueOnce(chainMock([]));

    const { result } = renderHook(() => useRecordings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    mockFrom.mockReturnValueOnce(chainMock(null, { message: "DB error" }));

    const { result } = renderHook(() => useRecordings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "DB error" });
  });
});

describe("useRecording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a single recording by ID", async () => {
    const recording = makeRecording({ id: "rec-123" });
    mockFrom.mockReturnValueOnce(singleChainMock(recording));

    const { result } = renderHook(() => useRecording("rec-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("rec-123");
    expect(result.current.data?.title).toBe("Test Recording");
  });

  it("does not fetch when id is undefined", async () => {
    const { result } = renderHook(() => useRecording(undefined), {
      wrapper: createWrapper(),
    });

    // Should stay in pending/idle state, never fetch
    expect(result.current.isFetching).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws on Supabase error", async () => {
    mockFrom.mockReturnValueOnce(singleChainMock(null, { message: "Not found" }));

    const { result } = renderHook(() => useRecording("bad-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "Not found" });
  });
});
