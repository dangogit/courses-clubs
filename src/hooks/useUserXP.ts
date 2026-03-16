import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getLevel } from "@/data/levels";

export interface UserXP {
  xpTotal: number;
  levelId: number;
  level: ReturnType<typeof getLevel>;
  displayName: string | null;
  avatarUrl: string | null;
}

export function useUserXP() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-xp"],
    queryFn: async (): Promise<UserXP> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { xpTotal: 0, levelId: 1, level: getLevel(0), displayName: null, avatarUrl: null };

      const { data, error } = await supabase
        .from("profiles")
        .select("xp_total, level_id, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error || !data) return { xpTotal: 0, levelId: 1, level: getLevel(0), displayName: null, avatarUrl: null };

      const xpTotal = data.xp_total ?? 0;
      const levelId = data.level_id ?? 1;

      return {
        xpTotal,
        levelId,
        level: getLevel(xpTotal),
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
