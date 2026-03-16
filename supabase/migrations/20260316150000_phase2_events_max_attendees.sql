-- Fix: enforce max_attendees cap on event_rsvps INSERT
-- Drops the existing policy and recreates with capacity check
-- Note: TOCTOU possible on concurrent RSVPs — acceptable for community events

DROP POLICY IF EXISTS "event_rsvps_insert_owner_tier" ON event_rsvps;

CREATE POLICY "event_rsvps_insert_owner_tier" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Owner check (cached subselect per Supabase best practice)
    (SELECT auth.uid()) = user_id
    -- Tier check
    AND (
      SELECT p.tier_level >= e.min_tier_level
      FROM profiles p, events e
      WHERE p.id = (SELECT auth.uid()) AND e.id = event_id
    )
    -- Capacity check: NULL max_attendees = unlimited
    AND (
      SELECT e.max_attendees IS NULL
        OR (SELECT count(*) FROM event_rsvps r WHERE r.event_id = event_id) < e.max_attendees
      FROM events e WHERE e.id = event_id
    )
  );
