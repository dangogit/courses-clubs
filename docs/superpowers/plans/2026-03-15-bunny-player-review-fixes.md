# BunnyPlayer Code Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 7 code review issues on the BunnyPlayer component — XSS vulnerability, RTL violations, placeholder unification, click callback, and documentation staleness.

**Architecture:** All changes are isolated to the `BunnyPlayer` component and its consumers. URL validation is added inline (no new files). The `VideoTutorialDetail` view's inline placeholder is replaced by extending `BunnyPlayer` with a `thumbnailUrl` prop.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, Tailwind CSS v4 (RTL logical properties)

**Spec:** `docs/superpowers/specs/2026-03-15-bunny-player-review-fixes-design.md`

---

## Chunk 1: Security & RTL fixes on BunnyPlayer

### Task 1: Add URL validation tests (TDD — red phase)

**Files:**
- Modify: `src/components/__tests__/BunnyPlayer.test.tsx`

- [ ] **Step 1: Write two failing tests for URL validation**

Add after the existing `"hides duration label..."` test (line 61):

```tsx
it("renders placeholder for javascript: URL", () => {
  const { container } = render(
    <BunnyPlayer videoUrl="javascript:alert(1)" />
  );

  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByText("לחצו לצפייה")).toBeDefined();
});

it("renders placeholder for non-Bunny HTTPS URL", () => {
  const { container } = render(
    <BunnyPlayer videoUrl="https://evil.com/embed/12345" />
  );

  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByText("לחצו לצפייה")).toBeDefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: 2 FAIL — both render an iframe instead of placeholder

### Task 2: Implement URL validation + iframe hardening (TDD — green phase)

**Files:**
- Modify: `src/components/BunnyPlayer.tsx`

- [ ] **Step 3: Add BUNNY_EMBED_HOST constant and isValidBunnyUrl function**

Add after the imports (line 1), before the interface:

```tsx
const BUNNY_EMBED_HOST = "iframe.mediadelivery.net";

function isValidBunnyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === BUNNY_EMBED_HOST;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Update the rendering condition**

Change line 27 from:
```tsx
if (videoUrl) {
```
To:
```tsx
if (videoUrl && isValidBunnyUrl(videoUrl)) {
```

- [ ] **Step 5: Add sandbox and loading attributes to iframe**

Change the iframe element (lines 31-37) to:
```tsx
<iframe
  src={videoUrl}
  title="Video player"
  className="w-full h-full border-0"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
  allowFullScreen
/>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: ALL 8 tests PASS (6 existing + 2 new)

- [ ] **Step 7: Commit security fixes**

```bash
git add src/components/BunnyPlayer.tsx src/components/__tests__/BunnyPlayer.test.tsx
git commit -m "fix(security): validate iframe URL and add sandbox to BunnyPlayer

Reject non-Bunny URLs (falls back to placeholder). Add sandbox and
loading=lazy attributes for defense-in-depth.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 3: Fix RTL directional classes

**Files:**
- Modify: `src/components/BunnyPlayer.tsx`

- [ ] **Step 8: Replace physical directional classes with logical equivalents**

Three replacements in the placeholder section:

1. Line 52: `mr-[-3px]` → `me-[-3px]`
2. Line 55: `left-4` → `start-4`
3. Line 61: `right-4` → `end-4`

- [ ] **Step 9: Run tests to verify nothing broke**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: ALL 8 tests PASS

- [ ] **Step 10: Commit RTL fix**

```bash
git add src/components/BunnyPlayer.tsx
git commit -m "fix: use RTL logical properties in BunnyPlayer placeholder

Replace mr-[-3px] with me-[-3px], left-4 with start-4, right-4
with end-4 for correct RTL layout.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Placeholder unification & click callback

### Task 4: Add thumbnailUrl test (TDD — red phase)

**Files:**
- Modify: `src/components/__tests__/BunnyPlayer.test.tsx`

- [ ] **Step 11: Write failing test for thumbnail placeholder**

```tsx
it("renders thumbnail placeholder when thumbnailUrl provided and no videoUrl", () => {
  const { container } = render(
    <BunnyPlayer videoUrl={null} thumbnailUrl="https://example.com/thumb.jpg" durationLabel="10 דק׳" />
  );

  expect(container.querySelector("iframe")).toBeNull();
  const img = container.querySelector("img");
  expect(img).not.toBeNull();
  expect(img!.getAttribute("src")).toBe("https://example.com/thumb.jpg");
  expect(screen.getByText("לחצו לצפייה")).toBeDefined();
  expect(screen.getByText("10 דק׳")).toBeDefined();
});
```

- [ ] **Step 12: Run test to verify it fails**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: FAIL — `thumbnailUrl` prop doesn't exist yet

### Task 5: Implement thumbnailUrl prop (TDD — green phase)

**Files:**
- Modify: `src/components/BunnyPlayer.tsx`

- [ ] **Step 13: Add thumbnailUrl to props interface and destructuring**

Update the interface:
```tsx
interface BunnyPlayerProps {
  videoUrl?: string | null;
  thumbnailUrl?: string;
  theaterMode?: boolean;
  durationLabel?: string;
}
```

Update the destructuring:
```tsx
export default function BunnyPlayer({
  videoUrl,
  thumbnailUrl,
  theaterMode = false,
  durationLabel,
}: BunnyPlayerProps) {
```

- [ ] **Step 14: Add thumbnail placeholder branch**

In the placeholder return (after the `if (videoUrl && isValidBunnyUrl(videoUrl))` block), replace the existing placeholder with a conditional:

```tsx
// Placeholder when no valid video URL is set
if (thumbnailUrl) {
  return (
    <div className={wrapperClass}>
      <div
        className={`${containerClass} relative overflow-hidden bg-muted group`}
      >
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
            <Play className="h-8 w-8 text-foreground fill-foreground me-[-3px]" />
          </div>
        </div>
        {durationLabel && (
          <div className="absolute bottom-3 start-3 bg-black/70 text-white text-sm px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {durationLabel}
          </div>
        )}
        <div className="absolute bottom-3 end-3">
          <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
            <Play className="h-3 w-3 fill-current" /> לחצו לצפייה
          </span>
        </div>
      </div>
    </div>
  );
}

// Gradient placeholder (no thumbnail)
return (
  <div className={wrapperClass}>
    <div
      className={`${containerClass} gradient-hero relative flex items-center justify-center group`}
    >
      {/* ... existing gradient placeholder content unchanged ... */}
    </div>
  </div>
);
```

Note: Keep the existing gradient placeholder code exactly as-is (with the RTL fixes from Task 3). Only the thumbnail branch is new.

- [ ] **Step 15: Run tests to verify they pass**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: ALL 9 tests PASS

- [ ] **Step 16: Commit thumbnailUrl prop**

```bash
git add src/components/BunnyPlayer.tsx src/components/__tests__/BunnyPlayer.test.tsx
git commit -m "feat: add thumbnailUrl prop to BunnyPlayer

Renders thumbnail image with play overlay when thumbnailUrl is
provided and no video URL is set.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 6: Add onPlaceholderClick tests (TDD — red phase)

**Files:**
- Modify: `src/components/__tests__/BunnyPlayer.test.tsx`

- [ ] **Step 17: Write failing tests for click callback and cursor-pointer**

Update the existing vitest import on line 1 to include `vi`: `import { describe, it, expect, vi } from "vitest";`

Update the RTL import on line 2 to include `fireEvent`: `import { render, screen, fireEvent } from "@testing-library/react";`

Then add tests:

```tsx
it("calls onPlaceholderClick when placeholder is clicked", () => {
  const handleClick = vi.fn();
  render(
    <BunnyPlayer videoUrl={null} onPlaceholderClick={handleClick} />
  );

  const placeholder = screen.getByText("לחצו לצפייה").closest("[class*='aspect-video']") as HTMLElement;
  fireEvent.click(placeholder);
  expect(handleClick).toHaveBeenCalledOnce();
});

it("placeholder has no cursor-pointer when onPlaceholderClick is absent", () => {
  const { container } = render(<BunnyPlayer videoUrl={null} />);

  const placeholder = container.querySelector("[class*='aspect-video']") as HTMLElement;
  expect(placeholder.className).not.toContain("cursor-pointer");
});
```

- [ ] **Step 18: Run tests to verify they fail**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: 2 FAIL — click handler never called (no onClick wired), cursor-pointer still hardcoded

### Task 7: Implement onPlaceholderClick prop (TDD — green phase)

**Files:**
- Modify: `src/components/BunnyPlayer.tsx`

- [ ] **Step 19: Add onPlaceholderClick to props**

Update the interface:
```tsx
interface BunnyPlayerProps {
  videoUrl?: string | null;
  thumbnailUrl?: string;
  theaterMode?: boolean;
  durationLabel?: string;
  onPlaceholderClick?: () => void;
}
```

Update destructuring to include `onPlaceholderClick`.

- [ ] **Step 20: Wire up onClick and conditional cursor-pointer on all placeholder containers**

Add a computed class after the existing `containerClass` declaration:
```tsx
const placeholderCursorClass = onPlaceholderClick ? "cursor-pointer" : "";
```

**Thumbnail placeholder container** (from Step 14) — change:
```tsx
<div
  className={`${containerClass} relative overflow-hidden bg-muted group`}
>
```
To:
```tsx
<div
  className={`${containerClass} relative overflow-hidden bg-muted group ${placeholderCursorClass}`}
  onClick={onPlaceholderClick}
>
```

**Gradient placeholder container** — change:
```tsx
<div
  className={`${containerClass} gradient-hero relative flex items-center justify-center group cursor-pointer`}
>
```
To:
```tsx
<div
  className={`${containerClass} gradient-hero relative flex items-center justify-center group ${placeholderCursorClass}`}
  onClick={onPlaceholderClick}
>
```

- [ ] **Step 21: Run tests to verify they pass**

Run: `npm test -- --run src/components/__tests__/BunnyPlayer.test.tsx`
Expected: ALL 11 tests PASS

- [ ] **Step 22: Commit onPlaceholderClick prop**

```bash
git add src/components/BunnyPlayer.tsx src/components/__tests__/BunnyPlayer.test.tsx
git commit -m "feat: add onPlaceholderClick callback to BunnyPlayer

Only shows cursor-pointer when callback is provided, removing
the misleading clickable affordance from the placeholder.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: View integration & documentation

### Task 8: Update VideoTutorialDetail to use unified BunnyPlayer

**Files:**
- Modify: `src/views/VideoTutorialDetail.tsx`

- [ ] **Step 23: Replace inline placeholder with BunnyPlayer**

Replace lines 63-89 (the conditional video player block):
```tsx
{tutorial.videoUrl ? (
  <BunnyPlayer
    videoUrl={tutorial.videoUrl}
    theaterMode={theaterMode}
    durationLabel={tutorial.duration}
  />
) : (
  <div className={theaterMode ? "bg-black/90 -mx-4 px-0 mb-5" : ""}>
  ...
  </div>
)}
```

With a single unconditional call:
```tsx
<BunnyPlayer
  videoUrl={tutorial.videoUrl}
  thumbnailUrl={tutorial.thumbnail}
  theaterMode={theaterMode}
  durationLabel={tutorial.duration}
/>
```

- [ ] **Step 24: Fix RTL in popular tutorials grid**

Two fixes:

1. Line 140: Change `mr-[-1px]` to `me-[-1px]`:
```tsx
<Play className="h-4 w-4 text-foreground fill-foreground me-[-1px]" />
```

2. Line 143: Change `left-1.5` to `start-1.5`:
```tsx
<div className="absolute bottom-1.5 start-1.5 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
```

- [ ] **Step 25: Clean up unused imports**

The `Play` and `Clock` imports on line 5 are still needed (used in the popular tutorials grid below). Verify — do NOT remove if still referenced. Only `Play` is used (line 140) and `Clock` (line 144). Keep both.

- [ ] **Step 26: Run all unit tests**

Run: `npm test -- --run`
Expected: ALL tests PASS (85 existing + 5 new = 90)

- [ ] **Step 27: Commit view integration**

```bash
git add src/views/VideoTutorialDetail.tsx
git commit -m "refactor: unify VideoTutorialDetail placeholder with BunnyPlayer

Replace inline thumbnail placeholder with BunnyPlayer's thumbnailUrl
prop. Fix mr-[-1px] RTL violation in popular tutorials grid.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 9: Documentation fixes

**Files:**
- Modify: `CLAUDE.md:142`
- Modify: `supabase/migrations/20260314220101_phase2_rename_video_url.sql`

- [ ] **Step 28: Fix CLAUDE.md stale reference**

Line 142, change:
```
| Bunny.net | Video streaming (courses, recordings, tutorials) — `bunny_video_id` field in lessons |
```
To:
```
| Bunny.net | Video streaming (courses, recordings, tutorials) — `video_url` field in lessons |
```

- [ ] **Step 29: Add clarifying comment to migration**

Add after line 2 of `supabase/migrations/20260314220101_phase2_rename_video_url.sql`:
```sql
-- Note: recordings and tutorials tables do not exist yet.
-- They will be created with video_url from the start (no rename needed).
```

- [ ] **Step 30: Commit documentation fixes**

```bash
git add CLAUDE.md supabase/migrations/20260314220101_phase2_rename_video_url.sql
git commit -m "docs: fix stale bunny_video_id references

Update CLAUDE.md to reference video_url. Add migration comment
noting recordings/tutorials tables will use video_url from creation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 10: Final verification

- [ ] **Step 31: Run full test suite**

Run: `npm test -- --run`
Expected: ALL 90 tests PASS

- [ ] **Step 32: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 33: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 34: Run E2E tests**

Run: `npx playwright test`
Expected: All existing E2E tests PASS

- [ ] **Step 35: Manual visual verification**

Start the dev server (`npm run dev`) and visually verify these three views render correctly:
1. **LessonDetail** — navigate to any lesson, confirm video player (or placeholder) displays properly
2. **RecordingDetail** — navigate to any recording, confirm placeholder displays properly
3. **VideoTutorialDetail** — navigate to any tutorial, confirm thumbnail placeholder displays with play overlay and duration label

Check both with and without `videoUrl` set (mock data currently has no URLs, so all should show placeholders).
