import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ReferralFriend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ReferralStats {
  totalReferred: number;
  totalXP: number;
  friends: ReferralFriend[];
}

export interface TopInviter {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  referral_count: number;
  total_xp: number;
}

export function useReferralStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["referral-stats"],
    queryFn: async (): Promise<ReferralStats> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { totalReferred: 0, totalXP: 0, friends: [] };

      const { data, error } = await supabase
        .from("referrals")
        .select("id, referred_id, reward_xp, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return { totalReferred: 0, totalXP: 0, friends: [] };

      // Fetch profile info for referred users
      const referredIds = data.map((r) => r.referred_id);
      let friends: ReferralFriend[] = [];

      if (referredIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", referredIds);

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, p])
        );

        friends = data.map((r) => {
          const profile = profileMap.get(r.referred_id);
          return {
            id: r.referred_id,
            display_name: profile?.display_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            created_at: r.created_at,
          };
        });
      }

      return {
        totalReferred: data.length,
        totalXP: data.reduce((sum, r) => sum + (r.reward_xp ?? 0), 0),
        friends,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useTopInviters(limit: number = 5) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["top-inviters", limit],
    queryFn: async (): Promise<TopInviter[]> => {
      const { data, error } = await supabase.rpc("get_top_inviters", {
        p_limit: limit,
      });

      if (error) throw error;
      return (data ?? []) as TopInviter[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
