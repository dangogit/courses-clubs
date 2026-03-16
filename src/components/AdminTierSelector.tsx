"use client";

import { TIER_META } from "@/lib/tiers";
import { useTiers } from "@/hooks/useTiers";

interface AdminTierSelectorProps {
  currentTierLevel: number;
  onTierChange: (level: number) => void;
  /** Show "ירושה" (inherited) option — used for lessons */
  showInherited?: boolean;
  disabled?: boolean;
}

export function AdminTierSelector({
  currentTierLevel,
  onTierChange,
  showInherited = false,
  disabled = false,
}: AdminTierSelectorProps) {
  const { data: tiers } = useTiers();
  const tierList = tiers ?? [];

  // Build options: optionally "inherited" (-1) + all tiers from DB
  const options: { level: number; name: string; color: string }[] = [];

  if (showInherited) {
    options.push({ level: -1, name: "ירושה", color: "0 0% 60%" });
  }

  for (const t of tierList) {
    options.push({
      level: t.level,
      name: t.name,
      color: t.color ?? TIER_META[t.level]?.color ?? "0 0% 50%",
    });
  }

  // Fallback when tiers haven't loaded yet
  if (tierList.length === 0) {
    for (const [levelStr, meta] of Object.entries(TIER_META)) {
      options.push({ level: Number(levelStr), name: meta.name, color: meta.color });
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">רמת גישה:</span>
      {options.map((opt) => {
        const isSelected = currentTierLevel === opt.level;
        return (
          <button
            key={opt.level}
            type="button"
            disabled={disabled}
            onClick={() => onTierChange(opt.level)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
              isSelected ? "text-white shadow-sm" : "bg-card hover:opacity-80"
            }`}
            style={
              isSelected
                ? { backgroundColor: `hsl(${opt.color})`, borderColor: `hsl(${opt.color})` }
                : { borderColor: `hsl(${opt.color} / 0.4)`, color: `hsl(${opt.color})` }
            }
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
