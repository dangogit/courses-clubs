import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

export interface CourseWithLessons extends CourseRow {
  lessons: LessonRow[];
}

export function useCourse(courseId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseWithLessons | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, lessons(*)")
        .eq("id", courseId!)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Sort lessons by order_index
      const lessons = (data.lessons as LessonRow[]).sort(
        (a, b) => a.order_index - b.order_index
      );

      return { ...data, lessons };
    },
  });
}
