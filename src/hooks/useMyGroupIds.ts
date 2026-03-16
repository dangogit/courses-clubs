import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMyGroupIds() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["myGroupIds"],
    queryFn: async (): Promise<Set<string>> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return new Set();

      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return new Set((data ?? []).map((r) => r.group_id));
    },
    staleTime: 2 * 60 * 1000,
  });
}
