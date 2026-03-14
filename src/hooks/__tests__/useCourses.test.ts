import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useCourses } from "../useCourses";

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

function makeCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: "course-1",
    title: "Test Course",
    description: "desc",
    thumbnail_url: null,
    tag: null,
    duration_label: "3h",
    min_tier_level: 0,
    order_index: 0,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    lessons: [{ id: "lesson-1" }, { id: "lesson-2" }, { id: "lesson-3" }],
    ...overrides,
  };
}

// Builds a chained Supabase query mock
function chainMock(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("useCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns courses with computed progress when some lessons are completed", async () => {
    const coursesChain = chainMock([
      makeCourse({
        id: "c1",
        lessons: [{ id: "l1" }, { id: "l2" }, { id: "l3" }, { id: "l4" }],
      }),
    ]);

    // Second call: lesson_progress
    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [{ lesson_id: "l1" }, { lesson_id: "l3" }],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(coursesChain) // "courses"
      .mockReturnValueOnce(progressChain); // "lesson_progress"

    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const courses = result.current.data!;
    expect(courses).toHaveLength(1);
    expect(courses[0].lessonCount).toBe(4);
    expect(courses[0].completedCount).toBe(2);
    expect(courses[0].progress).toBe(50);
  });

  it("returns 0% progress when no lessons are completed", async () => {
    const coursesChain = chainMock([
      makeCourse({ id: "c1", lessons: [{ id: "l1" }, { id: "l2" }] }),
    ]);

    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(coursesChain)
      .mockReturnValueOnce(progressChain);

    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].progress).toBe(0);
    expect(result.current.data![0].completedCount).toBe(0);
  });

  it("returns 100% progress when all lessons are completed", async () => {
    const coursesChain = chainMock([
      makeCourse({ id: "c1", lessons: [{ id: "l1" }, { id: "l2" }] }),
    ]);

    const progressChain: Record<string, unknown> = {};
    progressChain.select = vi.fn().mockReturnValue(progressChain);
    progressChain.in = vi.fn().mockResolvedValue({
      data: [{ lesson_id: "l1" }, { lesson_id: "l2" }],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(coursesChain)
      .mockReturnValueOnce(progressChain);

    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].progress).toBe(100);
    expect(result.current.data![0].completedCount).toBe(2);
  });

  it("handles courses with zero lessons gracefully", async () => {
    const coursesChain = chainMock([
      makeCourse({ id: "c1", lessons: [] }),
    ]);

    mockFrom.mockReturnValueOnce(coursesChain);
    // No progress call needed since allLessonIds is empty

    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].lessonCount).toBe(0);
    expect(result.current.data![0].progress).toBe(0);
  });

  it("throws on Supabase error", async () => {
    const coursesChain = chainMock(null, { message: "DB error" });

    mockFrom.mockReturnValueOnce(coursesChain);

    const { result } = renderHook(() => useCourses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "DB error" });
  });
});
