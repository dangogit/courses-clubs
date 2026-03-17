import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { EventDetail } from "@/hooks/useEvents";
import { TierAccessError } from "@/lib/errors";
import { TIER_META } from "@/lib/tiers";

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
        // Pre-flight tier check before INSERT
        const [{ data: profile }, { data: event }] = await Promise.all([
          supabase.from("profiles").select("tier_level").eq("id", user.id).single(),
          supabase.from("events").select("min_tier_level").eq("id", eventId).single(),
        ]);

        if (!profile) throw new Error("Could not fetch profile");
        if (!event) throw new Error("Event not found");

        if (profile.tier_level < event.min_tier_level) {
          throw new TierAccessError(event.min_tier_level);
        }

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

    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["events", eventId], context.previous);
      }

      if (err instanceof TierAccessError) {
        const tierName = TIER_META[err.requiredTierLevel]?.name ?? "גבוה יותר";
        toast.error("נדרש שדרוג", {
          description: `האירוע דורש מנוי ${tierName}. שדרגו כדי להירשם.`,
        });
      } else {
        toast.error("שגיאה", { description: "לא ניתן להירשם לאירוע. נסו שוב." });
      }
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
