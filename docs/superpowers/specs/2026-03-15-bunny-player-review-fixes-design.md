# BunnyPlayer Code Review Fixes — Design Spec

**Date:** 2026-03-15
**Branch:** `feat/bunny-video-player`
**Scope:** Address all 7 issues from the code review of the BunnyPlayer component and related changes.

## Context

The `feat/bunny-video-player` branch introduced a reusable `BunnyPlayer` component, renamed `bunny_video_id` to `video_url` in the schema, and integrated the player into 3 views. A code review identified 7 issues ranging from a critical XSS vulnerability to documentation staleness.

## Issues Addressed

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | XSS via unvalidated iframe `src` |
| 2 | High | Migration comment about recordings/tutorials tables |
| 3 | Medium-High | Stale `bunny_video_id` reference in CLAUDE.md |
| 4 | Medium | RTL directional `mr-` instead of `me-` |
| 5 | Medium | Two different placeholder styles (VideoTutorialDetail vs BunnyPlayer) |
| 6 | Low | No `loading="lazy"` on iframe |
| 7 | Low | Placeholder has `cursor-pointer` but no click handler |

## Design

### 1. Security: iframe URL validation

**File:** `src/components/BunnyPlayer.tsx`

Add a `isValidBunnyUrl` function at module scope:

```typescript
function isValidBunnyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "iframe.mediadelivery.net";
  } catch {
    return false;
  }
}
```

**Rendering logic change:** The iframe branch now checks `videoUrl && isValidBunnyUrl(videoUrl)`. If `videoUrl` is present but fails validation, the placeholder renders instead — no broken embed, no XSS vector.

**Defense-in-depth attributes on iframe:**
- `sandbox="allow-scripts allow-same-origin"` — restricts the embedded page's capabilities. Note: `allow-scripts` + `allow-same-origin` is necessary for the Bunny.net player to function. The URL validation ensures only `iframe.mediadelivery.net` is embedded, mitigating the sandbox escape risk.
- `loading="lazy"` — defers loading for offscreen embeds (issue #6)

**Constant extraction:** The hostname `"iframe.mediadelivery.net"` is extracted to a `BUNNY_EMBED_HOST` constant at the top of the file for easier future updates if Bunny.net changes their embed domain.

**New tests (2):**
- `"renders placeholder for javascript: URL"` — pass `javascript:alert(1)`, assert no iframe, assert placeholder visible
- `"renders placeholder for non-Bunny HTTPS URL"` — pass `https://evil.com/embed`, assert no iframe, assert placeholder visible

### 2. RTL directional fixes

**File:** `src/components/BunnyPlayer.tsx`

Three fixes in the placeholder section:
- Replace `mr-[-3px]` with `me-[-3px]` on the Play icon (line 52). `me-` is the logical margin-end that respects RTL layout direction per project conventions.
- Replace `left-4` with `start-4` on the duration label container (line 55). Physical `left` does not flip in RTL.
- Replace `right-4` with `end-4` on the "click to watch" label container (line 61).

**File:** `src/views/VideoTutorialDetail.tsx`

In the popular tutorials grid (line 140), replace `mr-[-1px]` with `me-[-1px]` on the Play icon. This file is already being modified for the placeholder unification.

**Out of scope:** Other views (`Tutorials.tsx`, `Recordings.tsx`, `AgentDetail.tsx`, `VideoRecommendations.tsx`) contain similar `mr-[-Npx]` patterns on Play icons. These should be addressed in a follow-up RTL sweep, not in this focused fix pass.

### 3. Placeholder unification — `thumbnailUrl` prop

**File:** `src/components/BunnyPlayer.tsx`

Add optional prop to `BunnyPlayerProps`:

```typescript
interface BunnyPlayerProps {
  videoUrl?: string | null;
  thumbnailUrl?: string;
  theaterMode?: boolean;
  durationLabel?: string;
  onPlaceholderClick?: () => void;
}
```

**Placeholder rendering logic (when no valid videoUrl):**
- If `thumbnailUrl` is provided: render a raw `<img>` with the thumbnail as background, dark overlay, centered white play button, and duration label. Matches the existing VideoTutorialDetail style. Note: raw `<img>` is intentional — thumbnail sources will later come from Bunny.net CDN which handles its own optimization, and the current mock data uses Unsplash URLs that are already optimized.
- If no `thumbnailUrl`: render the current gradient placeholder (unchanged).

Both variants share the same container structure, duration label positioning, and hover effects.

**File:** `src/views/VideoTutorialDetail.tsx`

Replace the 18-line conditional branch (lines 64-89) with a single `<BunnyPlayer>` call:

```tsx
<BunnyPlayer
  videoUrl={tutorial.videoUrl}
  thumbnailUrl={tutorial.thumbnail}
  theaterMode={theaterMode}
  durationLabel={tutorial.duration}
/>
```

Remove the now-unused `Play` and `Clock` imports if they become dead code after this change.

**New test (1):**
- `"renders thumbnail placeholder when thumbnailUrl provided and no videoUrl"` — assert `<img>` present with correct `src`, no iframe, placeholder text visible

### 4. Placeholder click callback — `onPlaceholderClick` prop

**File:** `src/components/BunnyPlayer.tsx`

- When `onPlaceholderClick` is provided: attach to the placeholder container's `onClick`, keep `cursor-pointer`
- When absent: remove `cursor-pointer` from the placeholder container (no fake affordance)

This is a passive prop — no existing view needs to pass it yet. It's a clean extension point for when videos require a click-to-load interaction (e.g., tier-gated content).

**New tests (2):**
- `"calls onPlaceholderClick when placeholder is clicked"` — pass a vi.fn(), simulate click, assert called
- `"placeholder has no cursor-pointer when onPlaceholderClick is absent"` — render without the prop, assert `cursor-pointer` is NOT in the placeholder container's className

### 5. Documentation fixes

**File:** `CLAUDE.md` (line 142)

Change:
```
| Bunny.net | Video streaming (courses, recordings, tutorials) — `bunny_video_id` field in lessons |
```
To:
```
| Bunny.net | Video streaming (courses, recordings, tutorials) — `video_url` field in lessons |
```

**File:** `supabase/migrations/20260314220101_phase2_rename_video_url.sql`

Add comment:
```sql
-- Note: recordings and tutorials tables do not exist yet.
-- They will be created with video_url from the start (no rename needed).
```

## Files Changed

| File | Change type |
|------|-------------|
| `src/components/BunnyPlayer.tsx` | Edit — validation, sandbox, lazy, thumbnailUrl, onPlaceholderClick, RTL |
| `src/components/__tests__/BunnyPlayer.test.tsx` | Edit — 5 new test cases |
| `src/views/VideoTutorialDetail.tsx` | Edit — replace inline placeholder with BunnyPlayer |
| `CLAUDE.md` | Edit — fix stale reference |
| `supabase/migrations/20260314220101_phase2_rename_video_url.sql` | Edit — add clarifying comment |

## Verification

- All existing 85 unit tests pass
- 5 new BunnyPlayer tests pass
- `npm run build` succeeds
- `npm run lint` clean
- Existing Playwright E2E tests pass (`npx playwright test`)
- Manual check: LessonDetail, RecordingDetail, VideoTutorialDetail all render correctly with and without videoUrl
