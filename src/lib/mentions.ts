/**
 * Extract @mentions from text content.
 * Matches @displayname patterns (1-2 words after @).
 * Same regex as the PostgreSQL notify_mentions() trigger.
 */
const MENTION_REGEX = /@([^\s@]+(?:\s[^\s@]+)?)/g;

export function extractMentions(content: string): string[] {
  const mentions = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    mentions.add(match[1]);
  }

  // Reset lastIndex for safety (global regex)
  MENTION_REGEX.lastIndex = 0;

  return Array.from(mentions);
}

/**
 * Check if text contains any @mentions.
 */
export function hasMentions(content: string): boolean {
  MENTION_REGEX.lastIndex = 0;
  const result = MENTION_REGEX.test(content);
  MENTION_REGEX.lastIndex = 0;
  return result;
}
