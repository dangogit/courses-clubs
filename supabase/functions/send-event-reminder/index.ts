// send-event-reminder — Placeholder for Phase 4
// Will be triggered by pg_cron 24h before each event to send reminder emails
// via Resend to all RSVP'd users.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Deno.serve(async (_req: Request) => {
  // Phase 4: Query event_rsvps for events starting in the next 24h,
  // fetch user emails from auth.users, send reminders via Resend.

  return new Response(
    JSON.stringify({ status: "not_implemented", message: "Event reminder function is a placeholder for Phase 4" }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
