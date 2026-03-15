import { Play, Clock } from "lucide-react";

const BUNNY_EMBED_HOST = "iframe.mediadelivery.net";

function isValidBunnyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === BUNNY_EMBED_HOST;
  } catch {
    return false;
  }
}

interface BunnyPlayerProps {
  videoUrl?: string | null;
  thumbnailUrl?: string;
  theaterMode?: boolean;
  durationLabel?: string;
  onPlaceholderClick?: () => void;
}

/**
 * Bunny.net video embed player.
 * When `videoUrl` is set, renders a responsive iframe.
 * When `thumbnailUrl` is set (and no valid videoUrl), renders a thumbnail image with play overlay.
 * Otherwise renders a gradient placeholder with a play icon.
 */
export default function BunnyPlayer({
  videoUrl,
  thumbnailUrl,
  theaterMode = false,
  durationLabel,
  onPlaceholderClick,
}: BunnyPlayerProps) {
  const wrapperClass = theaterMode
    ? "bg-black/90 -mx-3 sm:-mx-4 px-0 mb-4"
    : "";

  const containerClass = `w-full aspect-video ${
    theaterMode ? "rounded-none" : "rounded-2xl mb-4"
  } overflow-hidden shadow-lg`;

  const placeholderCursorClass = onPlaceholderClick ? "cursor-pointer" : "";

  if (videoUrl && isValidBunnyUrl(videoUrl)) {
    return (
      <div className={wrapperClass}>
        <div className={containerClass}>
          <iframe
            src={videoUrl}
            title="Video player"
            className="w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Thumbnail placeholder (when thumbnailUrl provided)
  if (thumbnailUrl) {
    return (
      <div className={wrapperClass}>
        <div
          className={`${containerClass} relative overflow-hidden bg-muted group ${placeholderCursorClass}`}
          onClick={onPlaceholderClick}
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

  // Gradient placeholder (no thumbnail) — keep existing code below unchanged
  return (
    <div className={wrapperClass}>
      <div
        className={`${containerClass} gradient-hero relative flex items-center justify-center group ${placeholderCursorClass}`}
        onClick={onPlaceholderClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,hsla(0,0%,100%,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300 shadow-2xl">
          <Play className="h-9 w-9 text-white me-[-3px]" />
        </div>
        {durationLabel && (
          <div className="absolute bottom-4 start-4">
            <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {durationLabel}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 end-4">
          <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
            <Play className="h-3 w-3 fill-current" /> לחצו לצפייה
          </span>
        </div>
      </div>
    </div>
  );
}
