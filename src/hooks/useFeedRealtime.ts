import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useFeedRealtime(groupId: string | null) {
  const queryClient = useQueryClient();
  const feedKey = groupId ?? "main";

  useEffect(() => {
    const supabase = createClient();
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
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed", feedKey] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient, feedKey]);
}
