import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useAdminSetLessonTier(courseId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      tierLevel,
    }: {
      lessonId: string;
      tierLevel: number; // -1 = reset to inherited (NULL)
    }) => {
      const { error } = await supabase.rpc("admin_set_lesson_tier", {
        p_lesson_id: lessonId,
        p_tier_level: tierLevel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("עודכן!", { description: "רמת הגישה לשיעור עודכנה" });
    },
    onError: () => {
      toast.error("שגיאה", { description: "לא ניתן לעדכן רמת גישה. נסו שוב." });
    },
  });
}
