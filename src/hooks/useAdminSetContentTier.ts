import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type ContentTable = "courses" | "groups" | "events" | "recordings";

export function useAdminSetContentTier() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      table,
      contentId,
      tierLevel,
    }: {
      table: ContentTable;
      contentId: string;
      tierLevel: number;
    }) => {
      const { error } = await supabase.rpc("admin_set_content_tier", {
        p_table_name: table,
        p_content_id: contentId,
        p_tier_level: tierLevel,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { table, contentId }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      if (table === "courses") {
        queryClient.invalidateQueries({ queryKey: ["course", contentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: [table, contentId] });
      }
      toast.success("עודכן!", { description: "רמת הגישה עודכנה בהצלחה" });
    },
    onError: () => {
      toast.error("שגיאה", { description: "לא ניתן לעדכן רמת גישה. נסו שוב." });
    },
  });
}
