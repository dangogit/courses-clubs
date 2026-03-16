import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type LeaderboardPeriod = "weekly" | "monthly" | "alltime";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
}

export interface UserRank {
  rank: number;
  points: number;
}

export function useLeaderboard(period: LeaderboardPeriod) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_period: period,
      });

      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserRank(period: LeaderboardPeriod) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-rank", period],
    queryFn: async (): Promise<UserRank | null> => {
      const { data, error } = await supabase.rpc("get_user_rank", {
        p_period: period,
      });

      if (error) throw error;
      const row = (data as UserRank[] | null)?.[0];
      return row ?? null;
    },
    staleTime: 2 * 60 * 1000,
  });
}
