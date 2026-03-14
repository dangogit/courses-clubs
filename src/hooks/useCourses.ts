import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

export interface CourseWithProgress extends CourseRow {
  lessonCount: number;
  completedCount: number;
  progress: number;
}

export function useCourses() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CourseWithProgress[]> => {
      // Fetch published courses with their lessons
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*, lessons(id)")
        .eq("is_published", true)
        .order("order_index");

      if (coursesError) throw coursesError;
      if (!courses) return [];

      // Collect all lesson IDs across all courses
      const allLessonIds = courses.flatMap(
        (c) => (c.lessons as Pick<LessonRow, "id">[]).map((l) => l.id)
      );

      // Fetch user's completed lessons in one query
      let completedSet = new Set<string>();
      if (allLessonIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .in("lesson_id", allLessonIds);

        if (progressError) throw progressError;
        completedSet = new Set(progress?.map((p) => p.lesson_id) ?? []);
      }

      // Compute progress per course
      return courses.map((course) => {
        const lessons = course.lessons as Pick<LessonRow, "id">[];
        const lessonCount = lessons.length;
        const completedCount = lessons.filter((l) =>
          completedSet.has(l.id)
        ).length;
        const progress =
          lessonCount > 0
            ? Math.round((completedCount / lessonCount) * 100)
            : 0;

        // Strip the nested lessons array — we only needed IDs for counting
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lessons: _lessons, ...courseData } = course;

        return {
          ...courseData,
          lessonCount,
          completedCount,
          progress,
        } as CourseWithProgress;
      });
    },
  });
}
