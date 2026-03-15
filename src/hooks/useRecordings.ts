import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type RecordingRow = Database["public"]["Tables"]["recordings"]["Row"];

/**
 * Fetch all published recordings, ordered by most recent first.
 */
export function useRecordings() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recordings"],
    queryFn: async (): Promise<RecordingRow[]> => {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("is_published", true)
        .order("order_index");

      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Fetch a single recording by UUID.
 */
export function useRecording(id: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recordings", id],
    queryFn: async (): Promise<RecordingRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
