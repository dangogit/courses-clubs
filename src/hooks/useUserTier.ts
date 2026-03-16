import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUserTier() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-tier"],
    queryFn: async (): Promise<number> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from("profiles")
        .select("tier_level")
        .eq("id", user.id)
        .single();

      if (error || !data) return 0;
      return data.tier_level;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
