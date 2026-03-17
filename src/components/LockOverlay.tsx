"use client";

import { Lock, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { TIER_META, TIER_LEVELS } from "@/lib/tiers";
import { canAccess } from "@/lib/tiers";

interface LockOverlayProps {
  requiredTierLevel: number;
  userTierLevel: number;
  /** "card" = overlay on thumbnail, "detail" = banner above content */
  variant?: "card" | "detail";
}

export function LockOverlay({ requiredTierLevel, userTierLevel, variant = "card" }: LockOverlayProps) {
  // Don't render if user has access
  if (canAccess(userTierLevel, requiredTierLevel)) return null;

  const meta = TIER_META[requiredTierLevel] ?? TIER_META[TIER_LEVELS.PREMIUM];

  if (variant === "card") {
    return (
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]"
        role="status"
        aria-label={`תוכן נעול — נדרש מנוי ${meta.name}`}
      >
        <Lock className="h-6 w-6 text-white/80 mb-1.5" aria-hidden="true" />
        <span
          className="text-[11px] font-bold rounded-full px-3 py-1"
          style={{
            backgroundColor: `hsl(${meta.color} / 0.2)`,
            color: `hsl(${meta.color})`,
          }}
        >
          {meta.name}
        </span>
      </div>
    );
  }

  // variant === "detail"
  return (
    <div
      className="rounded-xl border p-4 mb-5 flex items-center justify-between gap-3"
      role="status"
      aria-label={`תוכן נעול — נדרש מנוי ${meta.name}`}
      style={{
        borderColor: `hsl(${meta.color} / 0.3)`,
        backgroundColor: `hsl(${meta.color} / 0.05)`,
      }}
    >
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 shrink-0" aria-hidden="true" style={{ color: `hsl(${meta.color})` }} />
        <div>
          <p className="text-sm font-bold">
            תוכן זה דורש מנוי {meta.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            שדרגו את המנוי שלכם כדי לגשת לתוכן זה
          </p>
        </div>
      </div>
      <Link
        href="/subscription"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: `hsl(${meta.color})` }}
      >
        <ArrowUpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        שדרגו
      </Link>
    </div>
  );
}
