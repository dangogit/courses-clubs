import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { EventDetail } from "@/hooks/useEvents";

export function useEventRsvp(eventId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ wasRsvped }: { wasRsvped: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (wasRsvped) {
        // Remove RSVP — defense in depth: filter by user_id even though RLS covers it
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Add RSVP
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      }
    },

    // Optimistic update — runs BEFORE mutationFn
    onMutate: async ({ wasRsvped }) => {
      await queryClient.cancelQueries({ queryKey: ["events", eventId] });

      const previous = queryClient.getQueryData<EventDetail>([
        "events",
        eventId,
      ]);

      queryClient.setQueryData<EventDetail>(
        ["events", eventId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isRsvped: !wasRsvped,
            rsvpCount: old.rsvpCount + (wasRsvped ? -1 : 1),
          };
        }
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["events", eventId], context.previous);
      }
      toast.error("שגיאה", { description: "לא ניתן להירשם לאירוע. נסה שוב." });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Capture current RSVP state BEFORE calling mutate (before onMutate flips it)
  const toggleRsvp = () => {
    const cached = queryClient.getQueryData<EventDetail>(["events", eventId]);
    mutation.mutate({ wasRsvped: cached?.isRsvped ?? false });
  };

  return {
    toggleRsvp,
    isToggling: mutation.isPending,
  };
}
