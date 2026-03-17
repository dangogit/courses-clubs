"use client";

import { TIER_META, TIER_LEVELS } from "@/lib/tiers";

interface TierBadgeProps {
  tierLevel: number;
  size?: "sm" | "md";
  /** Whether to show badge for free tier (default: false — free content has no badge) */
  showFree?: boolean;
  className?: string;
}

export function TierBadge({ tierLevel, size = "sm", showFree = false, className = "" }: TierBadgeProps) {
  if (tierLevel === 0 && !showFree) return null;

  const meta = TIER_META[tierLevel] ?? TIER_META[TIER_LEVELS.PREMIUM];
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `hsl(${meta.color} / 0.15)`,
        color: `hsl(${meta.color})`,
      }}
    >
      {meta.name}
    </span>
  );
}
