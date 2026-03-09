'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Play, Clock, FileText, Zap, CheckCircle2, BookOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { videoTutorials, writtenGuides } from "@/data/tutorials";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import { getTagColor, getCategoryIcon, CONTENT_CATEGORIES } from "@/lib/tagColors";

export default function Tutorials() {
  const router = useRouter();
  const pathname = usePathname();
  const defaultTab = "video";
  const { isWatched } = useWatchedProgress("tutorial");
  const { isWatched: isRead } = useWatchedProgress("guide");

  const [activeVideoTag, setActiveVideoTag] = useState<string | null>(null);
  const [videoSearch, setVideoSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredVideos = videoTutorials.filter((v) => {
    const matchTag = activeVideoTag ? v.tag === activeVideoTag : true;
    const matchSearch = videoSearch
      ? v.title.includes(videoSearch) || v.description.includes(videoSearch)
      : true;
    return matchTag && matchSearch;
  });

  const filteredGuides = activeTag ? writtenGuides.filter((g) => g.tag === activeTag) : writtenGuides;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">הדרכות קצרות</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {videoTutorials.length + writtenGuides.length} הדרכות זמינות — וידאו ומדריכים כתובים
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} dir="rtl">
        <TabsList className="w-full h-14 rounded-2xl bg-muted/60 p-1.5 mb-8 grid grid-cols-2">
          <TabsTrigger
            value="video"
            className="h-full rounded-xl text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            הדרכות וידאו
            <span className="text-xs font-normal opacity-60">({videoTutorials.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="written"
            className="h-full rounded-xl text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            מדריכים כתובים
            <span className="text-xs font-normal opacity-60">({writtenGuides.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Video Tutorials */}
        <TabsContent value="video">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש לפי נושא, כלי או מרצה..."
              value={videoSearch}
              onChange={(e) => setVideoSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/60 bg-background pr-9 pl-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition"
            />
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveVideoTag(null)}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                activeVideoTag === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              הכל
            </button>
            {CONTENT_CATEGORIES.map((tag) => (
              <button
                key={tag}
              onClick={() => setActiveVideoTag(activeVideoTag === tag ? null : tag)}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                  activeVideoTag === tag
                    ? `${getTagColor(tag)} border-current`
                    : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {getCategoryIcon(tag) && <span>{getCategoryIcon(tag)}</span>}
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.length === 0 ? (
              <p className="col-span-3 text-center text-muted-foreground py-12 text-sm">לא נמצאו תוצאות</p>
            ) : null}
            {filteredVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/tutorials/video/${item.id}`)}
                className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-5 w-5 text-foreground fill-foreground mr-[-2px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.duration}
                  </div>
                  {isWatched(item.id) && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <Badge variant="secondary" className={`text-xs mb-2 border-0 ${getTagColor(item.tag)}`}>
                    {item.tag}
                  </Badge>
                  <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-primary transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Written Guides */}
        <TabsContent value="written">
          {/* Tag filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                activeTag === null
                  ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:border-slate-500/30 hover:text-foreground"
              }`}
            >
              הכל
              <span className="opacity-60">({writtenGuides.length})</span>
            </button>
            {CONTENT_CATEGORIES.map((tag) => {
              const count = writtenGuides.filter((g) => g.tag === tag).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                    activeTag === tag
                      ? `${getTagColor(tag)} border-current`
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
                  }`}
                >
                  {tag}
                  <span className="opacity-60 mr-1">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/tutorials/guide/${item.id}`)}
                className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
              >
                {/* Cover Image */}
                <div className="relative h-44 overflow-hidden bg-muted">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-emerald-500/40" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <BookOpen className="h-5 w-5 text-emerald-700" />
                    </div>
                  </div>
                  {/* Read time badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.readTime}
                  </div>
                  {/* Read badge */}
                  {isRead(item.id) && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <Badge className={`text-xs mb-2 border-0 ${getTagColor(item.tag)}`}>
                    {item.tag}
                  </Badge>
                  <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-primary transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
