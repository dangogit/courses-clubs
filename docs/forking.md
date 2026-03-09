# Forking Guide — Create a New Club

`courses-clubs` is the upstream template. To deploy a new branded club platform:

## Step 1: Fork the Repo

On GitHub, fork `dangogit/courses-clubs` and rename it for your club:
- `brainers-web` for Brainers Club
- `nextlevel-web` for Next Level
- `<club-name>-web` for any other club

Clone your fork locally:
```bash
git clone https://github.com/dangogit/<your-fork>.git
cd <your-fork>
npm install
```

## Step 2: Edit `src/config/club.ts`

This is the **only source file** you need to change. Everything else inherits from it.

```typescript
export const club = {
  // Identity
  name: "Brainers Club",            // ← Club display name (used in sidebar, title, emails)
  tagline: "קהילת ה-AI הישראלית",   // ← Shown in hero + metadata description
  logo: "/assets/club-logo.png",     // ← Sidebar logo path (keep this filename)
  heroLogo: "/assets/club-hero-logo.png", // ← Large marketing logo
  favicon: "/assets/favicon.ico",    // ← Browser tab icon

  // Theme colors — HSL components (no hsl() wrapper)
  colors: {
    primary: "195 100% 42%",         // ← Main brand color (buttons, links, highlights)
    primaryForeground: "0 0% 100%",  // ← Text on primary backgrounds (usually white)
    accent: "195 80% 94%",           // ← Subtle backgrounds, hover states
    accentForeground: "195 100% 30%",// ← Text on accent backgrounds
  },

  // Social & contact
  whatsappGroup: "https://chat.whatsapp.com/...", // ← WhatsApp community link
  instagramUrl: "https://instagram.com/...",       // ← Instagram profile
  supportEmail: "support@yourclub.co.il",          // ← Support contact email

  // Feature flags — set to false to hide features from the UI
  features: {
    chat: true,        // Direct messaging (/chats)
    aiMentor: true,    // Floating AI chat button
    tutorials: true,   // Tutorials section (/tutorials)
    aiAgents: true,    // AI agents gallery (/ai-agents)
  },
} as const;
```

### Color Format

Colors use HSL **components only** — space-separated, no `hsl()` wrapper:

```
✅  "195 100% 42%"
❌  "hsl(195, 100%, 42%)"
❌  "#00aad4"
```

The `hsl()` wrapper is added automatically in `globals.css`. You can use any online HSL color picker to find the right values.

### Feature Flags

| Flag | What it controls |
|---|---|
| `chat` | Shows/hides the Chats link in sidebar + `/chats` route |
| `aiMentor` | Shows/hides the floating AI Mentor button |
| `tutorials` | Shows/hides Tutorials in sidebar + `/tutorials` routes |
| `aiAgents` | Shows/hides AI Agents in sidebar + `/ai-agents` routes |

## Step 3: Replace Assets

Swap the files in `public/assets/`:

| File | Description | Recommended size |
|---|---|---|
| `club-logo.png` | Sidebar logo | Height ≤ 48px, transparent background |
| `club-hero-logo.png` | Hero / marketing logo | 400–800px wide |
| `favicon.ico` | Browser tab icon | 32×32 or 64×64 |

Keep the same filenames — they're referenced by the config above.

## Step 4: Verify

```bash
npm run build
```

Should complete with zero errors. If you see TypeScript errors, check that your `club.ts` values are strings (not numbers).

## Step 5: Deploy

The app is a standard Next.js project. Deploy to:

- **Vercel** — connect your GitHub fork, zero config needed
- **Coolify / Hetzner** — use the Node.js buildpack, set `npm run build && npm run start`
- **Any Node host** — `npm run build && npm start`

## Staying In Sync with Upstream

When the upstream template (`dangogit/courses-clubs`) gets updates:

```bash
git remote add upstream https://github.com/dangogit/courses-clubs.git
git fetch upstream
git merge upstream/main
# Resolve any conflicts (usually none — you only changed club.ts + assets)
```

Your `club.ts` changes and `public/assets/` files will not conflict since upstream doesn't touch them.
