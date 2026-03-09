'use client';
import { useRef } from "react";
import { CheckCircle2, Circle, Eye } from "lucide-react";
import confetti from "canvas-confetti";

interface WatchedButtonProps {
  watched: boolean;
  onToggle: () => void;
  remaining?: number;
}

export default function WatchedButton({ watched, onToggle, remaining }: WatchedButtonProps) {
  const hasConfettied = useRef(false);

  const handleClick = () => {
    if (!watched && !hasConfettied.current) {
      hasConfettied.current = true;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#22c55e", "#10b981", "#34d399", "#6ee7b7"],
      });
    }
    onToggle();
  };

  return (
    <div className="flex items-center gap-3 my-4">
      <button
        onClick={handleClick}
        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
          watched
            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
        }`}
      >
        {watched ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
        {watched ? "נצפה" : "סיימתי לצפות"}
      </button>
      {watched && remaining !== undefined && remaining > 0 && (
        <span className="text-xs text-muted-foreground">
          עוד {remaining} לסיום
        </span>
      )}
    </div>
  );
}
