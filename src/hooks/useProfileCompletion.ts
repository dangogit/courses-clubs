import { useState, useEffect, useCallback } from "react";

export interface ProfileData {
  avatar?: string;      // custom avatar URL
  bio?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  occupation?: string;
}

const STORAGE_KEY = "brainers_profile";
const DEFAULT_BIO = "חובב AI ולומד לכל החיים. חבר מועדון מינואר 2026.";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=you";

export function useProfileCompletion() {
  const [profile, setProfileState] = useState<ProfileData>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const saveProfile = useCallback((updates: Partial<ProfileData>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Listen for storage changes from other tabs / components
  useEffect(() => {
    const handler = () => {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        setProfileState(data);
      } catch {}
    };
    window.addEventListener("storage", handler);
    window.addEventListener("brainers_profile_updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("brainers_profile_updated", handler);
    };
  }, []);

  const steps = [
    {
      key: "avatar",
      label: "תמונת פרופיל",
      emoji: "📷",
      points: 10,
      completed: !!profile.avatar && profile.avatar !== DEFAULT_AVATAR,
    },
    {
      key: "bio",
      label: "כותרת / Bio",
      emoji: "✏️",
      points: 5,
      completed: !!profile.bio && profile.bio !== DEFAULT_BIO,
    },
    {
      key: "social",
      label: "רשתות חברתיות",
      emoji: "🔗",
      points: 5,
      completed: !!(profile.linkedin || profile.instagram || profile.facebook || profile.website),
    },
    {
      key: "occupation",
      label: "תחום עיסוק",
      emoji: "🏢",
      points: 5,
      completed: !!profile.occupation,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const remainingPoints = steps
    .filter((s) => !s.completed)
    .reduce((sum, s) => sum + s.points, 0);

  return { steps, completedCount, totalCount, progressPercent, remainingPoints, profile, saveProfile };
}

/** Call this after saving profile data so the sidebar widget re-reads immediately */
export function notifyProfileUpdated() {
  window.dispatchEvent(new Event("brainers_profile_updated"));
}
