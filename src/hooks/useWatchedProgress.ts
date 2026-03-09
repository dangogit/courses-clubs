import { useState, useCallback, useMemo } from "react";
import { initialRecordings } from "@/data/recordings";

const STORAGE_KEYS = {
  recording: "watched-recordings",
  course: "watched-courses",
  tutorial: "watched-tutorials",
  guide: "read-guides",
} as const;

const COURSE_COUNT = 6;

type ProgressType = "recording" | "course" | "tutorial" | "guide";

function getStoredIds(type: ProgressType): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[type]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeIds(type: ProgressType, ids: number[]) {
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(ids));
}

export function useWatchedProgress(type: ProgressType) {
  const [watchedIds, setWatchedIds] = useState<number[]>(() => getStoredIds(type));

  const totalCount =
    type === "recording" ? initialRecordings.length :
    type === "tutorial" ? 6 :
    type === "guide" ? 6 :
    COURSE_COUNT;

  const isWatched = useCallback(
    (id: number) => watchedIds.includes(id),
    [watchedIds]
  );

  const toggleWatched = useCallback(
    (id: number) => {
      setWatchedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        storeIds(type, next);
        return next;
      });
    },
    [type]
  );

  const watchedCount = watchedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

  const encouragement = useMemo(() => {
    if (progressPercent === 0) return "בואו נתחיל!";
    if (progressPercent <= 30) return "התחלה מצוינת! 🚀";
    if (progressPercent <= 70) return "אתם בדרך הנכונה! 💪";
    if (progressPercent < 100) return "כמעט סיימתם! 🔥";
    return "מדהים! סיימתם הכל! 🏆";
  }, [progressPercent]);

  return {
    isWatched,
    toggleWatched,
    watchedIds,
    watchedCount,
    totalCount,
    progressPercent,
    encouragement,
  };
}
