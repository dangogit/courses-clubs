'use client';
import { useState, useRef } from "react";
import { Play, ChevronLeft, ChevronRight, Clock, Eye, Flame, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { CONTENT_CATEGORIES, getTagColor } from "@/lib/tagColors";

const filters = [
  { key: "הכל", type: "all" as const },
  { key: "פופולרי", type: "sort" as const },
  ...CONTENT_CATEGORIES.map((cat) => ({ key: cat, type: "category" as const })),
];

const videos = [
  {
    id: 0,
    title: "הטרנדים הכי חמים בעולם הקריירה ל-2026 ואילו כלי AI חובה להכיר",
    duration: "1:23:00",
    views: 342,
    tag: "חדש",
    tagType: "new" as const,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 1,
    title: "איך לחשוב על מוצר לעסק וליצור לו הצעה שאי אפשר לסרב לה בעזרת AI",
    duration: "58:00",
    views: 891,
    tag: "פופולרי",
    tagType: "popular" as const,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 2,
    title: "מפגש אסטרטגיה חודשי – תכנון Q1 2026",
    duration: "1:10:00",
    views: 215,
    tag: "חדש",
    tagType: "new" as const,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 3,
    title: "אוטומציה עם Make + AI",
    duration: "45:00",
    views: 567,
    tag: null,
    tagType: null,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 4,
    title: "Sendpulse אינטגרציה מלאה",
    duration: "1:05:00",
    views: 178,
    tag: null,
    tagType: null,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 5,
    title: "למידת מכונה למתחילים",
    duration: "1:30:00",
    views: 430,
    tag: "פופולרי",
    tagType: "popular" as const,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 6,
    title: "כלי AI חדשים 2026",
    duration: "52:00",
    views: 623,
    tag: "חדש",
    tagType: "new" as const,
    image: null,
    speaker: "עדן ביבס",
  },
  {
    id: 7,
    title: "בניית סוכן AI אוטונומי",
    duration: "1:15:00",
    views: 312,
    tag: null,
    tagType: null,
    image: null,
    speaker: "עדן ביבס",
  },
];

const gradients = [
  "from-[hsl(195,100%,35%)] to-[hsl(210,90%,45%)]",
  "from-[hsl(250,70%,45%)] to-[hsl(280,60%,50%)]",
  "from-[hsl(160,65%,35%)] to-[hsl(195,80%,40%)]",
  "from-[hsl(340,70%,45%)] to-[hsl(20,80%,50%)]",
  "from-[hsl(30,80%,45%)] to-[hsl(45,90%,50%)]",
  "from-[hsl(195,90%,40%)] to-[hsl(250,70%,50%)]",
  "from-[hsl(170,60%,40%)] to-[hsl(195,100%,42%)]",
  "from-[hsl(280,60%,45%)] to-[hsl(340,70%,50%)]",
];

// Hide horizontal scrollbar while keeping X scroll functionality.
// We use a combination of Tailwind `scrollbar-none` (for supported browsers) and fallback inline style for others.

export default function VideoRecommendations() {
  const [activeFilter, setActiveFilter] = useState("הכל");
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "right" ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft < -5);
    setCanScrollRight(scrollLeft > -(scrollWidth - clientWidth - 5));
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
            <Play className="h-3.5 w-3.5 text-primary-foreground mr-[-1px]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm leading-none">מפגשים מומלצים</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{videos.length} סרטונים</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
            aria-label="גלול ימינה"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
            aria-label="גלול שמאלה"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          const colorClass = isActive && f.type === "category" ? getTagColor(f.key) : "";
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer border ${
                isActive
                  ? f.type === "category"
                    ? `${colorClass} border-current shadow-sm`
                    : "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f.key}
            </button>
          );
        })}
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-none px-4 pb-4"
        // Hide scrollbar in all browsers: scrollbar-width for Firefox, and ::-webkit-scrollbar for Webkit browsers (Chrome, Safari, Edge)
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        <style>
          {`
            /* Hide scrollbar for Chrome, Safari and Opera */
            .scrollbar-none::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              background: transparent !important;
            }
          `}
        </style>
        {videos.map((v, i) => (
          <div
            key={v.id}
            className="shrink-0 w-52 cursor-pointer group"
            style={{ scrollSnapAlign: "start" }}
            onClick={() => router.push(`/recordings/${v.id}`)}
          >
            {/* Thumbnail */}
            <div
              className={`h-32 rounded-xl relative overflow-hidden ${
                v.image ? "" : `bg-gradient-to-br ${gradients[i % gradients.length]}`
              }`}
            >
              {v.image ? (
                <img
                  src={v.image}
                  alt={v.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.15),transparent_50%)]" />
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all duration-200 shadow-lg">
                  <Play className="h-4 w-4 text-white mr-[-2px]" />
                </div>
              </div>

              {/* Tag badge */}
              {v.tag && (
                <span
                  className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    v.tagType === "popular"
                      ? "bg-orange-500/90 text-white"
                      : "bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {v.tagType === "popular" ? (
                    <Flame className="h-2 w-2" />
                  ) : (
                    <Sparkles className="h-2 w-2" />
                  )}
                  {v.tag}
                </span>
              )}

              {/* Duration */}
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {v.duration}
              </span>
            </div>

            {/* Info */}
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-150">
                {v.title}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{v.speaker}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Eye className="h-2.5 w-2.5" />
                  {v.views.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
