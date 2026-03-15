import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useCourse } from "../useCourse";

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

function makeLesson(overrides: Record<string, unknown> = {}) {
  return {
    id: "lesson-1",
    course_id: "course-1",
    title: "Test Lesson",
    description: "desc",
    video_url: null,
    duration_label: "25 דק׳",
    min_tier_level: null,
    order_index: 0,
    is_published: true,
    ...overrides,
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
    lessons: [makeLesson()],
    ...overrides,
  };
}

// Builds a chained Supabase query mock for .select().eq().single()
function singleChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("useCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns course with lessons sorted by order_index", async () => {
    const course = makeCourse({
      lessons: [
        makeLesson({ id: "l3", order_index: 2, title: "Third" }),
        makeLesson({ id: "l1", order_index: 0, title: "First" }),
        makeLesson({ id: "l2", order_index: 1, title: "Second" }),
      ],
    });

    mockFrom.mockReturnValueOnce(singleChain(course));

    const { result } = renderHook(() => useCourse("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.lessons).toHaveLength(3);
    expect(data.lessons[0].title).toBe("First");
    expect(data.lessons[1].title).toBe("Second");
    expect(data.lessons[2].title).toBe("Third");
  });

  it("returns null when course is not found", async () => {
    mockFrom.mockReturnValueOnce(singleChain(null));

    const { result } = renderHook(() => useCourse("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it("does not fetch when courseId is undefined", async () => {
    const { result } = renderHook(() => useCourse(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled — not loading, no data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws on Supabase error", async () => {
    mockFrom.mockReturnValueOnce(singleChain(null, { message: "DB error" }));

    const { result } = renderHook(() => useCourse("course-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "DB error" });
  });
});
