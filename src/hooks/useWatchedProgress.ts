import { useState, useCallback, useMemo } from "react";

const STORAGE_KEYS = {
  recording: "watched-recordings",
  tutorial: "watched-tutorials",
  guide: "read-guides",
} as const;

type ProgressType = "recording" | "tutorial" | "guide";

/** Default total counts for types still using mock data */
const DEFAULT_TOTALS: Record<ProgressType, number> = {
  recording: 0,
  tutorial: 6,
  guide: 6,
};

function getStoredIds(type: ProgressType): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[type]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeIds(type: ProgressType, ids: string[]) {
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(ids));
}

export function useWatchedProgress(type: ProgressType, totalOverride?: number) {
  const [watchedIds, setWatchedIds] = useState<string[]>(() => getStoredIds(type));

  const totalCount = totalOverride ?? DEFAULT_TOTALS[type];

  const isWatched = useCallback(
    (id: string | number) => watchedIds.includes(String(id)),
    [watchedIds]
  );

  const toggleWatched = useCallback(
    (id: string | number) => {
      const strId = String(id);
      setWatchedIds((prev) => {
        const next = prev.includes(strId) ? prev.filter((x) => x !== strId) : [...prev, strId];
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
