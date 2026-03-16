import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface InviteLink {
  id: string;
  code: string;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export function useInviteLink() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["invite-link"],
    queryFn: async (): Promise<InviteLink | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("invite_links")
        .select("id, code, uses_count, max_uses, expires_at, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error) return null;
      return data as InviteLink;
    },
    staleTime: 5 * 60 * 1000,
  });
}
