export const club = {
  // Identity
  name: "Brainers Club",
  tagline: "קהילת ה-AI הישראלית",
  logo: "/assets/club-logo.png",
  heroLogo: "/assets/club-hero-logo.png",
  favicon: "/assets/favicon.ico",

  // Theme colors (HSL values — map to CSS variables in globals.css)
  colors: {
    primary: "195 100% 42%",
    primaryForeground: "0 0% 100%",
    accent: "195 80% 94%",
    accentForeground: "195 100% 30%",
  },

  // Social & links
  whatsappGroup: "https://chat.whatsapp.com/...",
  instagramUrl: "https://instagram.com/brainers",
  supportEmail: "support@brainers.co.il",

  // Feature flags (forks can disable optional features)
  features: {
    chat: true,
    aiMentor: true,
    tutorials: true,
    aiAgents: true,
  },
} as const;

export type ClubConfig = typeof club;
