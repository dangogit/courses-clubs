import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export function useFeedRealtime(groupId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const feedKey = groupId ?? "main";

  useEffect(() => {
    const channelName = groupId ? `feed-${groupId}` : "feed-main";
    const filter = groupId
      ? `group_id=eq.${groupId}`
      : "group_id=is.null";

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter,
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_payload: RealtimePostgresChangesPayload<PostRow>) => {
          // Invalidate feed query to refetch with fresh data
          // This is simpler and more reliable than manual cache manipulation
          queryClient.invalidateQueries({ queryKey: ["feed", feedKey] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient, supabase, feedKey]);
}
