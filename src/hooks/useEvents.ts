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
    queryFn: async (): Promise<EventWithRsvpCount[]> => {
      // 1. Fetch published events ordered by starts_at ascending
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("starts_at", { ascending: true });

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];

      // 2. Fetch all RSVPs for these events in one query (avoid N+1)
      const eventIds = events.map((e) => e.id);
      const { data: rsvps, error: rsvpsError } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .in("event_id", eventIds);

      if (rsvpsError) throw rsvpsError;

      // 3. Count RSVPs per event client-side
      const rsvpCountMap = new Map<string, number>();
      for (const rsvp of rsvps ?? []) {
        rsvpCountMap.set(
          rsvp.event_id,
          (rsvpCountMap.get(rsvp.event_id) ?? 0) + 1
        );
      }

      // 4. Merge counts into events
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
    queryFn: async (): Promise<EventDetail> => {
      // 1. Fetch single event by ID
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();

      if (eventError) throw eventError;

      // 2. Fetch RSVP count using head + exact count (no data transfer)
      const { count, error: countError } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!);

      if (countError) throw countError;

      // 3. Check if current user has RSVP'd
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
