import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type TierRow = Database["public"]["Tables"]["tiers"]["Row"];

export function useTiers() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["tiers"],
    queryFn: async (): Promise<TierRow[]> => {
      const { data, error } = await supabase
        .from("tiers")
        .select("*")
        .order("level");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — tiers rarely change
  });
}
