'use client';

import { useRouter } from "next/navigation";
import {
  Play,
  Clock,
  Calendar,
  Eye,
  Search,
  CheckCircle,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import { useRecordings } from "@/hooks/useRecordings";
import { getTagColor, getCategoryIcon } from "@/lib/tagColors";
import ProgressBanner from "@/components/ProgressBanner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CONTENT_CATEGORIES } from "@/lib/tagColors";
import { formatHebDate } from "@/lib/formatDate";

const ITEMS_PER_PAGE = 12;

const gradients = [
  "from-[hsl(195,100%,35%)] to-[hsl(210,90%,45%)]",
  "from-[hsl(250,70%,45%)] to-[hsl(280,60%,50%)]",
  "from-[hsl(160,65%,35%)] to-[hsl(195,80%,40%)]",
  "from-[hsl(340,70%,45%)] to-[hsl(20,80%,50%)]",
  "from-[hsl(30,80%,45%)] to-[hsl(45,90%,50%)]",
  "from-[hsl(195,90%,40%)] to-[hsl(250,70%,50%)]",
  "from-[hsl(270,60%,50%)] to-[hsl(310,70%,55%)]",
  "from-[hsl(140,60%,35%)] to-[hsl(170,70%,40%)]",
];

function getGradient(index: number) {
  return gradients[index % gradients.length];
}

interface FilterDef {
  key: string;
  type: "all" | "sort" | "category";
  icon?: React.ReactNode;
}

const staticFilters: FilterDef[] = [
  { key: "הכל", type: "all" },
  { key: "פופולרי", type: "sort", icon: <TrendingUp className="h-3 w-3" /> },
  ...CONTENT_CATEGORIES.map((cat) => ({ key: cat, type: "category" as const })),
];

export default function RecordingsPage() {
  const { data: recordings = [], isLoading, error } = useRecordings();
  const { isWatched, watchedCount, totalCount, progressPercent, encouragement } =
    useWatchedProgress("recording", recordings.length);
  const [activeFilter, setActiveFilter] = useState("הכל");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeFilterObj = staticFilters.find((f) => f.key === activeFilter) ?? staticFilters[0];

  const processedRecordings = useMemo(() => {
    let result = [...recordings];

    if (activeFilterObj.type === "category") {
      result = result.filter((r) => r.tags.includes(activeFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.speaker ?? "").toLowerCase().includes(q)
      );
    }

    if (activeFilter === "פופולרי") {
      result.sort((a, b) => b.view_count - a.view_count);
    }
    // Default order from DB is order_index — no re-sort needed

    return result;
  }, [recordings, activeFilter, searchQuery, activeFilterObj.type]);

  const visibleRecordings = processedRecordings.slice(0, displayCount);
  const hasMore = displayCount < processedRecordings.length;

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [activeFilter, searchQuery]);

  const loadMore = useCallback(() => {
    if (hasMore) setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  }, [hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto text-center py-20">
        <p className="text-destructive font-semibold">שגיאה בטעינת ההקלטות</p>
        <p className="text-xs text-muted-foreground mt-1">נסו לרענן את הדף</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Play className="h-4.5 w-4.5 text-primary-foreground mr-[-2px]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">הקלטות</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? "טוען..." : `${recordings.length} הקלטות · ${watchedCount} נצפו`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="mt-4">
        <ProgressBanner
          watchedCount={watchedCount}
          totalCount={totalCount}
          progressPercent={progressPercent}
          encouragement={encouragement}
        />
      </div>

      {/* Search */}
      <div className="relative mt-4 mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="חיפוש לפי נושא, כלי או מרצה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 rounded-xl"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5 pb-1">
        {staticFilters.map((f) => {
          const icon = getCategoryIcon(f.key);
          const isActive = activeFilter === f.key;
          const colorClass = isActive && f.type === "category" ? getTagColor(f.key) : "";
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                isActive
                  ? f.type === "category"
                    ? `${colorClass} border-current shadow-sm`
                    : "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {icon && <span>{icon}</span>}
              {!icon && f.icon}
              {f.key}
            </button>
          );
        })}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> טוען הקלטות...
            </span>
          ) : (
            <>
              מציג <span className="font-semibold text-foreground">{visibleRecordings.length}</span> מתוך{" "}
              <span className="font-semibold text-foreground">{processedRecordings.length}</span> הקלטות
            </>
          )}
        </p>
        {searchQuery && (
          <Badge variant="secondary" className="text-xs rounded-full gap-1">
            חיפוש: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="cursor-pointer hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card/80 rounded-2xl border border-border/50 overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recordings Grid */}
      {!isLoading && visibleRecordings.length === 0 ? (
        <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/40">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-muted-foreground">לא נמצאו הקלטות</p>
          <p className="text-xs text-muted-foreground mt-1">נסו לשנות את החיפוש או הפילטר</p>
          <button
            onClick={() => { setSearchQuery(""); setActiveFilter("הכל"); }}
            className="mt-3 text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            נקה סינון
          </button>
        </div>
      ) : !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecordings.map((r) => {
            const watched = isWatched(r.id);
            const catColor = getTagColor(r.tags[0]);
            const gradient = getGradient(r.order_index);

            return (
              <div
                key={r.id}
                className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden hover:elevated-shadow hover:border-primary/30 transition-all duration-300 cursor-pointer group relative"
                onClick={() => router.push(`/recordings/${r.id}`)}
              >
                {/* Thumbnail */}
                <div
                  className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.12),transparent_55%)]" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Play button */}
                  <div className="relative h-14 w-14 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/50 transition-all duration-200 shadow-lg">
                    <Play className="h-6 w-6 text-white mr-[-2px]" />
                  </div>

                  {/* Duration badge */}
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {r.duration_label}
                  </span>

                  {/* Category badge */}
                  {r.tags[0] && (
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                      {r.tags[0]}
                    </span>
                  )}

                  {/* Watched checkmark */}
                  {watched && (
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-lg">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Watched progress line */}
                {watched && <div className="h-0.5 bg-emerald-500" />}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors leading-snug mb-1">
                    {r.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>

                  {/* Category pills */}
                  {r.tags.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTagColor(cat)}`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                    <Avatar className="h-7 w-7 ring-2 ring-primary/10 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.speaker_avatar}`} />
                      <AvatarFallback className="text-[9px] font-bold">{r.speaker?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-none truncate">
                        {r.speaker}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{formatHebDate(r.recorded_at)}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Eye className="h-3 w-3" />
                      {r.view_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel + skeleton */}
      {hasMore && (
        <>
          <div ref={sentinelRef} className="h-1" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card/80 rounded-2xl border border-border/50 overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-14" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasMore && visibleRecordings.length > 0 && processedRecordings.length > ITEMS_PER_PAGE && (
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4 flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-border inline-block" />
          הגעתם לסוף — {processedRecordings.length} הקלטות
          <span className="w-8 h-px bg-border inline-block" />
        </p>
      )}
    </div>
  );
}
