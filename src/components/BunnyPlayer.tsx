import { Play, Clock } from "lucide-react";

interface BunnyPlayerProps {
  videoUrl?: string | null;
  theaterMode?: boolean;
  durationLabel?: string;
}

/**
 * Bunny.net video embed player.
 * When `videoUrl` is set, renders a responsive iframe.
 * Otherwise renders a gradient placeholder with a play icon.
 */
export default function BunnyPlayer({
  videoUrl,
  theaterMode = false,
  durationLabel,
}: BunnyPlayerProps) {
  const wrapperClass = theaterMode
    ? "bg-black/90 -mx-3 sm:-mx-4 px-0 mb-4"
    : "";

  const containerClass = `w-full aspect-video ${
    theaterMode ? "rounded-none" : "rounded-2xl mb-4"
  } overflow-hidden shadow-lg`;

  if (videoUrl) {
    return (
      <div className={wrapperClass}>
        <div className={containerClass}>
          <iframe
            src={videoUrl}
            title="Video player"
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Placeholder when no video URL is set
  return (
    <div className={wrapperClass}>
      <div
        className={`${containerClass} gradient-hero relative flex items-center justify-center group cursor-pointer`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,hsla(0,0%,100%,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300 shadow-2xl">
          <Play className="h-9 w-9 text-white mr-[-3px]" />
        </div>
        {durationLabel && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {durationLabel}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 right-4">
          <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
            <Play className="h-3 w-3 fill-current" /> לחצו לצפייה
          </span>
        </div>
      </div>
    </div>
  );
}
