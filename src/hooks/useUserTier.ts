import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TIER_LEVELS } from "@/lib/tiers";

export function useUserTier() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-tier"],
    queryFn: async (): Promise<number> => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return TIER_LEVELS.FREE;

      const { data, error } = await supabase
        .from("profiles")
        .select("tier_level")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data?.tier_level ?? TIER_LEVELS.FREE;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
