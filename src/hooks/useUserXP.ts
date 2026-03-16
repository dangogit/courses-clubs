import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getLevel } from "@/data/levels";

export interface UserXP {
  xpTotal: number;
  levelId: number;
  level: ReturnType<typeof getLevel>;
}

export function useUserXP() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-xp"],
    queryFn: async (): Promise<UserXP> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { xpTotal: 0, levelId: 1, level: getLevel(0) };

      const { data, error } = await supabase
        .from("profiles")
        .select("xp_total, level_id")
        .eq("id", user.id)
        .single();

      if (error || !data) return { xpTotal: 0, levelId: 1, level: getLevel(0) };

      const xpTotal = data.xp_total ?? 0;
      const levelId = data.level_id ?? 1;

      return {
        xpTotal,
        levelId,
        level: getLevel(xpTotal),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
