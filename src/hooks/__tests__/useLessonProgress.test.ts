import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useLessonProgress } from "../useLessonProgress";

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

// Chain mock for lesson_progress SELECT queries
function selectChain(lessonIds: string[]) {
  // First call: lessons query
  const lessonsChain: Record<string, unknown> = {};
  lessonsChain.select = vi.fn().mockReturnValue(lessonsChain);
  lessonsChain.eq = vi.fn().mockResolvedValue({
    data: lessonIds.map((id) => ({ id })),
    error: null,
  });

  // Second call: lesson_progress query
  const progressChain: Record<string, unknown> = {};
  progressChain.select = vi.fn().mockReturnValue(progressChain);
  progressChain.in = vi.fn().mockResolvedValue({
    data: [],
    error: null,
  });

  return { lessonsChain, progressChain };
}

describe("useLessonProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches completed lesson IDs for a course", async () => {
    const lessonsChain: Record<string, unknown> = {};
    lessonsChain.select = vi.fn().mockReturnValue(lessonsChain);
    lessonsChain.eq = vi.fn().mockResolvedValue({
      data: [{ id: "l1" }, { id: "l2" }, { id: "l3" }],
      error: null,
    });

    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [{ lesson_id: "l1" }, { lesson_id: "l3" }],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(lessonsChain) // "lessons"
      .mockReturnValueOnce(progressChain); // "lesson_progress"

    const { result } = renderHook(() => useLessonProgress("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isCompleted("l1")).toBe(true);
    expect(result.current.isCompleted("l2")).toBe(false);
    expect(result.current.isCompleted("l3")).toBe(true);
  });

  it("returns empty set when course has no lessons", async () => {
    const lessonsChain: Record<string, unknown> = {};
    lessonsChain.select = vi.fn().mockReturnValue(lessonsChain);
    lessonsChain.eq = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockFrom.mockReturnValueOnce(lessonsChain);

    const { result } = renderHook(() => useLessonProgress("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.completedLessonIds.size).toBe(0);
  });

  it("does not fetch when courseId is undefined", async () => {
    const { result } = renderHook(() => useLessonProgress(undefined), {
      wrapper: createWrapper(),
    });

    // Should stay loading (disabled query)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.completedLessonIds.size).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("toggleProgress inserts when lesson is not completed", async () => {
    // Initial fetch: no completed lessons
    const lessonsChain: Record<string, unknown> = {};
    lessonsChain.select = vi.fn().mockReturnValue(lessonsChain);
    lessonsChain.eq = vi.fn().mockResolvedValue({
      data: [{ id: "l1" }],
      error: null,
    });

    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(lessonsChain)
      .mockReturnValueOnce(progressChain);

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const { result } = renderHook(() => useLessonProgress("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Set up insert mock
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    // Also mock the invalidation re-fetch
    const refetchLessons: Record<string, unknown> = {};
    refetchLessons.select = vi.fn().mockReturnValue(refetchLessons);
    refetchLessons.eq = vi.fn().mockResolvedValue({
      data: [{ id: "l1" }],
      error: null,
    });
    const refetchProgress: Record<string, unknown> = {};
    refetchProgress.select = vi.fn().mockReturnValue(refetchProgress);
    refetchProgress.in = vi.fn().mockResolvedValue({
      data: [{ lesson_id: "l1" }],
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(refetchLessons)
      .mockReturnValueOnce(refetchProgress);

    act(() => {
      result.current.toggleProgress("l1");
    });

    // Optimistic update should show completed immediately
    await waitFor(() => expect(result.current.isCompleted("l1")).toBe(true));
  });

  it("toggleProgress deletes when lesson is already completed", async () => {
    // Initial fetch: l1 is completed
    const lessonsChain: Record<string, unknown> = {};
    lessonsChain.select = vi.fn().mockReturnValue(lessonsChain);
    lessonsChain.eq = vi.fn().mockResolvedValue({
      data: [{ id: "l1" }],
      error: null,
    });

    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [{ lesson_id: "l1" }],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(lessonsChain)
      .mockReturnValueOnce(progressChain);

    const { result } = renderHook(() => useLessonProgress("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isCompleted("l1")).toBe(true));

    // Set up delete mock
    const deleteChain: Record<string, unknown> = {};
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain);
    deleteChain.eq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce(deleteChain);

    // Mock re-fetch after mutation
    const refetchLessons: Record<string, unknown> = {};
    refetchLessons.select = vi.fn().mockReturnValue(refetchLessons);
    refetchLessons.eq = vi.fn().mockResolvedValue({
      data: [{ id: "l1" }],
      error: null,
    });
    const refetchProgress: Record<string, unknown> = {};
    refetchProgress.select = vi.fn().mockReturnValue(refetchProgress);
    refetchProgress.in = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(refetchLessons)
      .mockReturnValueOnce(refetchProgress);

    act(() => {
      result.current.toggleProgress("l1");
    });

    // Optimistic update should show not completed
    await waitFor(() => expect(result.current.isCompleted("l1")).toBe(false));
  });
});
