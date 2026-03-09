export const levels = [
  { name: "מתעניין", min: 0, rank: 1, icon: "🌱" },
  { name: "סקרן פעיל", min: 100, rank: 2, icon: "💪" },
  { name: "לומד מסור", min: 250, rank: 3, icon: "🤝" },
  { name: "משתתף פעיל", min: 500, rank: 4, icon: "⭐" },
  { name: "משתתף מתקדם", min: 1000, rank: 5, icon: "🎤" },
  { name: "מוביל ידע", min: 1500, rank: 6, icon: "🧠" },
  { name: "מומחה תוכן", min: 2000, rank: 7, icon: "🏆" },
  { name: "משתתף בולט", min: 2750, rank: 8, icon: "🎓" },
  { name: "מאסטר למידה", min: 4500, rank: 9, icon: "💎" },
  { name: "גורו קהילה", min: 6500, rank: 10, icon: "🔥" },
  { name: "אלוף השראה", min: 7500, rank: 11, icon: "✨" },
  { name: "אייקון מועדון", min: 8000, rank: 12, icon: "👑" },
  { name: "שגריר מועדון", min: 10000, rank: 13, icon: "🌟" },
  { name: "סופרנובה", min: 12500, rank: 14, icon: "🌠" },
  { name: "אגדה חיה", min: 15000, rank: 15, icon: "🦁" },
];

export function getLevel(points: number) {
  const lvl = [...levels].reverse().find((l) => points >= l.min) || levels[0];
  const idx = levels.indexOf(lvl);
  const nextLvl = levels[idx + 1];
  const progress = nextLvl
    ? ((points - lvl.min) / (nextLvl.min - lvl.min)) * 100
    : 100;
  return {
    ...lvl,
    progress,
    nextLvl,
    pointsToNext: nextLvl ? nextLvl.min - points : 0,
  };
}
