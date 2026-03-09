'use client';
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressBannerProps {
  watchedCount: number;
  totalCount: number;
  progressPercent: number;
  encouragement: string;
  label?: string;
}

export default function ProgressBanner({
  watchedCount,
  totalCount,
  progressPercent,
  encouragement,
  label = "הקלטות",
}: ProgressBannerProps) {
  if (watchedCount === 0) return null;

  return (
    <div className="mb-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            צפיתם ב-{watchedCount} מתוך {totalCount} {label}
          </p>
          <p className="text-xs text-muted-foreground">{encouragement}</p>
        </div>
        <span className="text-lg font-bold text-primary shrink-0">{progressPercent}%</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  );
}
