import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];

export interface GroupDetail extends GroupRow {
  memberCount: number;
  isMember: boolean;
}

export function useGroup(id: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["groups", id],
    queryFn: async (): Promise<GroupDetail | null> => {
      if (!id) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: group, error } = await supabase
        .from("groups")
        .select("*, group_members(count)")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!group) return null;

      let isMember = false;
      if (user) {
        const { data: membership } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        isMember = !!membership;
      }

      const { group_members, ...rest } = group;
      return {
        ...rest,
        memberCount:
          (group_members as unknown as { count: number }[])[0]?.count ?? 0,
        isMember,
      } as GroupDetail;
    },
    enabled: !!id,
  });
}
