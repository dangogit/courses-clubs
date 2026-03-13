export const MAILPIT_URL = "http://127.0.0.1:55124";

export const TEST_USER = {
  email: "e2e-test@courses-clubs.local",
  password: "TestUser1234!",
  displayName: "E2E Test User",
} as const;

interface MailpitMessage {
  ID: string;
  To: Array<{ Address: string }>;
  Subject: string;
  Created: string;
}

interface MailpitMessageDetail {
  HTML: string;
  Text: string;
}

/**
 * Fetches the latest magic link URL from Mailpit for a given email address.
 * Uses the Mailpit search API to find messages sent to the specific email.
 */
export async function getLatestMagicLink(
  email: string
): Promise<string | null> {
  // Search for messages sent to this email
  const searchRes = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`
  );
  if (!searchRes.ok) return null;

  const data = await searchRes.json();
  const messages: MailpitMessage[] = data.messages ?? [];
  if (messages.length === 0) return null;

  // Get the latest message (first in list — Mailpit returns newest first)
  const latest = messages[0];
  const msgRes = await fetch(
    `${MAILPIT_URL}/api/v1/message/${latest.ID}`
  );
  if (!msgRes.ok) return null;

  const msgData: MailpitMessageDetail = await msgRes.json();
  const body = msgData.HTML || msgData.Text || "";

  // Extract the magic link URL — handle HTML-encoded ampersands
  const match = body.match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/);
  if (!match) return null;

  // Decode HTML entities (&amp; → &)
  let link = match[1].replace(/&amp;/g, "&");

  return link;
}

/**
 * Follows a Supabase magic link verify URL and extracts the auth code.
 * Supabase redirects to site_url with ?code=..., but our test server
 * may be on a different port. This follows the redirect manually and
 * returns just the code, so the test can navigate to its own callback URL.
 */
export async function extractAuthCode(
  magicLinkUrl: string
): Promise<string | null> {
  const res = await fetch(magicLinkUrl, { redirect: "manual" });

  if (res.status < 300 || res.status >= 400) {
    return null;
  }

  const location = res.headers.get("location");
  if (!location) return null;

  const url = new URL(location);
  return url.searchParams.get("code");
}

/**
 * Deletes all messages in Mailpit.
 */
export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, {
    method: "DELETE",
  });
}

/**
 * Polls Mailpit for a magic link sent to the given email, then
 * extracts the auth code by following the verify URL server-side.
 */
export async function waitForMagicLinkCode(
  page: { waitForTimeout: (ms: number) => Promise<void> },
  email: string,
  maxAttempts = 10
): Promise<string> {
  let magicLink: string | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.waitForTimeout(500);
    magicLink = await getLatestMagicLink(email);
    if (magicLink) break;
  }

  if (!magicLink) {
    throw new Error(
      `Magic link not found in Mailpit for ${email} after ${maxAttempts * 500}ms`
    );
  }

  const code = await extractAuthCode(magicLink);
  if (!code) {
    throw new Error("Failed to extract auth code from magic link redirect");
  }

  return code;
}
