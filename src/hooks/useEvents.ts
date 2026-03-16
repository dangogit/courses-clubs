import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface EventWithRsvpCount extends EventRow {
  rsvpCount: number;
}

export interface EventDetail extends EventRow {
  rsvpCount: number;
  isRsvped: boolean;
}

// ---------------------------------------------------------------------------
// useEvents — fetches all published events with RSVP counts
// ---------------------------------------------------------------------------

export function useEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events"],
    staleTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async (): Promise<EventWithRsvpCount[]> => {
      // 1. Fetch published events ordered by starts_at ascending
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("starts_at", { ascending: true });

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];

      // 2. Fetch RSVP counts via head+count (no row data transfer)
      const counts = await Promise.all(
        events.map(async (e) => {
          const { count } = await supabase
            .from("event_rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", e.id);
          return { id: e.id, count: count ?? 0 };
        })
      );
      const rsvpCountMap = new Map(counts.map((c) => [c.id, c.count]));

      // 3. Merge counts into events
      return events.map((event) => ({
        ...event,
        rsvpCount: rsvpCountMap.get(event.id) ?? 0,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// useEvent — fetches a single event with RSVP count + current user's status
// ---------------------------------------------------------------------------

export function useEvent(eventId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events", eventId],
    enabled: !!eventId,
    staleTime: 60 * 1000, // 1 minute
    queryFn: async (): Promise<EventDetail> => {
      // 1. Fetch single event by ID
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();

      if (eventError) throw eventError;

      // 2. Fetch RSVP count + current user in parallel
      const [{ count, error: countError }, { data: { user } }] = await Promise.all([
        supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId!),
        supabase.auth.getUser(),
      ]);

      if (countError) throw countError;

      // 3. Check if current user has RSVP'd
      let isRsvped = false;
      if (user) {
        const { data: rsvp } = await supabase
          .from("event_rsvps")
          .select("event_id")
          .eq("event_id", eventId!)
          .eq("user_id", user.id)
          .maybeSingle();

        isRsvped = rsvp !== null;
      }

      return {
        ...event,
        rsvpCount: count ?? 0,
        isRsvped,
      };
    },
  });
}
