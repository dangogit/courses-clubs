import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TierAccessError } from "@/lib/errors";
import { TIER_META } from "@/lib/tiers";

export function useJoinGroup() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Pre-flight tier check — show helpful error instead of opaque RLS failure
      const [{ data: profile }, { data: group }] = await Promise.all([
        supabase.from("profiles").select("tier_level").eq("id", user.id).single(),
        supabase.from("groups").select("min_tier_level").eq("id", groupId).single(),
      ]);

      if (!profile) throw new Error("Could not fetch profile");
      if (!group) throw new Error("Group not found");

      if (profile.tier_level < group.min_tier_level) {
        throw new TierAccessError(group.min_tier_level);
      }

      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["myGroupIds"] });
    },
    onError: (err) => {
      if (err instanceof TierAccessError) {
        const tierName = TIER_META[err.requiredTierLevel]?.name ?? "גבוה יותר";
        toast.error("נדרש שדרוג", {
          description: `הקבוצה דורשת מנוי ${tierName}. שדרגו כדי להצטרף.`,
        });
      } else {
        toast.error("שגיאה", { description: "לא הצלחנו להצטרף לקבוצה. נסו שוב." });
      }
    },
  });
}
