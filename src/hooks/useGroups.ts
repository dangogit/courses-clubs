import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];

export interface GroupWithCount extends GroupRow {
  memberCount: number;
}

export function useGroups() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<GroupWithCount[]> => {
      const { data, error } = await supabase
        .from("groups")
        .select("*, group_members(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((group) => {
        const { group_members, ...rest } = group;
        return {
          ...rest,
          memberCount:
            (group_members as unknown as { count: number }[])[0]?.count ?? 0,
        } as GroupWithCount;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
