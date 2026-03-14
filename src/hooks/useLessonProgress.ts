import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useLessonProgress(courseId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["lesson-progress", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<Set<string>> => {
      // First get all lesson IDs for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId!);

      if (lessonsError) throw lessonsError;
      if (!lessons?.length) return new Set();

      const lessonIds = lessons.map((l) => l.id);

      // Then get progress for those lessons (RLS filters to current user)
      const { data: progress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .in("lesson_id", lessonIds);

      if (progressError) throw progressError;

      return new Set(progress?.map((p) => p.lesson_id) ?? []);
    },
  });

  const completedLessonIds = query.data ?? new Set<string>();

  const toggleMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isCompleted = completedLessonIds.has(lessonId);

      if (isCompleted) {
        const { error } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lesson_progress")
          .insert({ user_id: user.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    // Optimistic update
    onMutate: async (lessonId: string) => {
      await queryClient.cancelQueries({
        queryKey: ["lesson-progress", courseId],
      });

      const previous = queryClient.getQueryData<Set<string>>([
        "lesson-progress",
        courseId,
      ]);

      queryClient.setQueryData<Set<string>>(
        ["lesson-progress", courseId],
        (old) => {
          const next = new Set(old);
          if (next.has(lessonId)) {
            next.delete(lessonId);
          } else {
            next.add(lessonId);
          }
          return next;
        }
      );

      return { previous };
    },
    onError: (_err, _lessonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["lesson-progress", courseId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-progress", courseId],
      });
      // Also invalidate the courses list so progress updates there
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  return {
    completedLessonIds,
    isCompleted: (lessonId: string) => completedLessonIds.has(lessonId),
    toggleProgress: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isLoading: query.isLoading,
    error: query.error,
  };
}
