'use client';
import { useRef } from "react";
import { CheckCircle2, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";

interface ReadButtonProps {
  read: boolean;
  onToggle: () => void;
}

export default function ReadButton({ read, onToggle }: ReadButtonProps) {
  const hasConfettied = useRef(false);

  const handleClick = () => {
    if (!read && !hasConfettied.current) {
      hasConfettied.current = true;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
      });
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
        read
          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
          : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
      }`}
    >
      {read ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
      {read ? "נקרא ✓" : "קראתי את המדריך"}
    </button>
  );
}
