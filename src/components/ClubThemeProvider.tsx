'use client';

import { club } from "@/config/club";

export function ClubThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        '--primary': club.colors.primary,
        '--primary-foreground': club.colors.primaryForeground,
        '--accent': club.colors.accent,
        '--accent-foreground': club.colors.accentForeground,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
