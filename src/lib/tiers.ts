/**
 * Check if a user with the given tier level can access content
 * requiring the specified minimum tier level.
 */
export function canAccess(userTierLevel: number, contentMinTierLevel: number): boolean {
  return userTierLevel >= contentMinTierLevel;
}

/**
 * For lessons: resolve the effective tier level, falling back to
 * the parent course's tier when the lesson doesn't have an override.
 */
export function getEffectiveTierLevel(
  lessonMinTierLevel: number | null | undefined,
  courseMinTierLevel: number
): number {
  return lessonMinTierLevel ?? courseMinTierLevel;
}

/** Tier level constants for readability */
export const TIER_LEVELS = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
} as const;

/** Static tier metadata (avoids DB dependency for simple UI rendering) */
export const TIER_META: Record<number, { name: string; color: string }> = {
  0: { name: "חינם", color: "120 60% 40%" },
  1: { name: "בסיסי", color: "195 100% 42%" },
  2: { name: "פרימיום", color: "45 100% 50%" },
};
