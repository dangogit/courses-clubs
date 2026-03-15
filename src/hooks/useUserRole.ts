import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "member" | "moderator" | "admin";

export function useUserRole() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-role"],
    queryFn: async (): Promise<UserRole> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "member";

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !data) return "member";
      return data.role as UserRole;
    },
    staleTime: 5 * 60 * 1000,
  });
}
