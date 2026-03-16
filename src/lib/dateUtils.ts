import { useState, useEffect } from "react";

/**
 * Extract YYYY-MM-DD from an ISO timestamp string.
 */
export function getDateStr(startsAt: string): string {
  return startsAt.slice(0, 10);
}

/**
 * Extract HH:MM (local time) from an ISO timestamp string.
 */
export function getTimeStr(startsAt: string): string {
  const d = new Date(startsAt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Hebrew weekday name (long form, e.g. "יום רביעי").
 */
export function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { weekday: "long" });
}

/**
 * Hebrew weekday name (short form, e.g. "ד׳").
 */
export function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { weekday: "short" });
}

/**
 * Format date as DD.MM string.
 */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

/**
 * Full Hebrew date (e.g. "4 בפברואר 2026").
 */
export function formatDateHebrew(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Live countdown hook. Returns a Hebrew string like "3 ימים, 5 שעות"
 * or "עכשיו!" when the target has passed.
 * Guard: returns "" if startsAt is empty (e.g., during loading).
 */
export function useCountdown(startsAt: string): string {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!startsAt) return;
    const target = new Date(startsAt);
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("עכשיו!"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      if (days > 0) setTimeLeft(`${days} ימים, ${hours} שעות`);
      else if (hours > 0) setTimeLeft(`${hours} שעות, ${minutes} דקות`);
      else setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")} דקות`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startsAt]);
  return timeLeft;
}
