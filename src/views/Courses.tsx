'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Clock, CheckCircle2, Sparkles, Zap, Brain,
  BarChart3, Bot, Code2, Megaphone, Filter, Play,
  GraduationCap, ChevronLeft,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressBanner from "@/components/ProgressBanner";
import { TierBadge } from "@/components/TierBadge";
import { LockOverlay } from "@/components/LockOverlay";
import { useCourses } from "@/hooks/useCourses";
import { useUserTier } from "@/hooks/useUserTier";
import { canAccess } from "@/lib/tiers";
import { motion } from "framer-motion";

const courseIcons = [Brain, Sparkles, Bot, Megaphone, Zap, BarChart3, Code2];

const courseGradients = [
  "from-[hsl(195,100%,35%)] to-[hsl(210,90%,45%)]",
  "from-[hsl(250,70%,45%)] to-[hsl(280,60%,50%)]",
  "from-[hsl(160,65%,35%)] to-[hsl(195,80%,40%)]",
  "from-[hsl(340,70%,45%)] to-[hsl(20,80%,50%)]",
  "from-[hsl(45,90%,45%)] to-[hsl(30,85%,50%)]",
  "from-[hsl(195,90%,40%)] to-[hsl(250,70%,50%)]",
];

const tagStyles: Record<string, { bg: string; dot: string }> = {
  "פופולרי": { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  "חדש":    { bg: "bg-primary/10 text-primary", dot: "bg-primary" },
  "הושלם":  { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  "מתקדם":  { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
};

const filterOptions = [
  { key: "הכל", label: "כל הקורסים" },
  { key: "בתהליך", label: "בתהליך" },
  { key: "הושלמו", label: "הושלמו" },
  { key: "חדשים", label: "חדשים" },
];

function CoursesLoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-4 pt-3 border-t border-border/40">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Courses() {
  const router = useRouter();
  const { data: courses = [], isLoading, error } = useCourses();
  const { data: userTier = 0 } = useUserTier();
  const [activeFilter, setActiveFilter] = useState("הכל");

  const filteredCourses = courses.filter((c) => {
    if (activeFilter === "הכל") return true;
    if (activeFilter === "בתהליך") return c.progress > 0 && c.progress < 100;
    if (activeFilter === "הושלמו") return c.progress === 100;
    if (activeFilter === "חדשים") return c.tag === "חדש";
    return true;
  });

  const inProgressCount = courses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const completedCount = courses.filter((c) => c.progress === 100).length;
  const totalLessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const completedLessons = courses.reduce((sum, c) => sum + c.completedCount, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const encouragement =
    overallProgress === 0 ? "בואו נתחיל!" :
    overallProgress <= 30 ? "התחלה מצוינת! 🚀" :
    overallProgress <= 70 ? "אתם בדרך הנכונה! 💪" :
    overallProgress < 100 ? "כמעט סיימתם! 🔥" :
    "מדהים! סיימתם הכל! 🏆";

  return (
    <div className="w-full max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">מרכז הלמידה</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {courses.length} קורסים · {completedCount} הושלמו · {inProgressCount} בתהליך
            </p>
          </div>
        </div>

        {/* Stats chips — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border/60 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
            {completedCount} הושלמו
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border/60 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Play className="h-3.5 w-3.5 text-primary fill-primary" />
            {inProgressCount} בתהליך
          </div>
        </div>
      </div>

      {/* ── Progress Banner ── */}
      <ProgressBanner
        watchedCount={completedLessons}
        totalCount={totalLessons}
        progressPercent={overallProgress}
        encouragement={encouragement}
        label="שיעורים"
      />

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 mt-5 mb-6 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {filterOptions.map((f) => {
          const count =
            f.key === "בתהליך" ? inProgressCount :
            f.key === "הושלמו" ? completedCount : null;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f.label}
              {count !== null && count > 0 && (
                <span className={`text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                  activeFilter === f.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <CoursesLoadingSkeleton />
      ) : error ? (
        <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/40">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">שגיאה בטעינת קורסים</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/40">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">אין קורסים בקטגוריה זו</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((c, filteredIndex) => {
            const orderIdx = c.order_index;
            const CourseIcon = courseIcons[orderIdx % courseIcons.length];
            const gradient = courseGradients[orderIdx % courseGradients.length];
            const isCompleted = c.progress === 100;
            const isInProgress = c.progress > 0 && c.progress < 100;
            const tagMeta = c.tag ? tagStyles[c.tag] : null;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: filteredIndex * 0.05 }}
                className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => router.push(`/courses/${c.id}`)}
              >
                {/* Thumbnail */}
                <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden shrink-0`}>
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.13),transparent_55%)]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-300" />

                  {/* Big icon */}
                  <CourseIcon className="h-14 w-14 text-white/20 group-hover:text-white/30 group-hover:scale-110 transition-all duration-300" />

                  {/* Tag */}
                  {tagMeta && c.tag && (
                    <span className={`absolute top-3 start-3 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md bg-black/35 text-white`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tagMeta.dot}`} />
                      {c.tag}
                    </span>
                  )}

                  {/* Completed badge */}
                  {isCompleted && (
                    <div className="absolute top-3 end-3 bg-[hsl(var(--success))] rounded-full p-1 shadow-lg">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  {/* Tier badge — only show when not completed (completed badge takes that spot) */}
                  {!isCompleted && c.min_tier_level > 0 && (
                    <div className="absolute top-3 end-3">
                      <TierBadge tierLevel={c.min_tier_level} />
                    </div>
                  )}

                  {/* Progress bar at bottom of thumbnail */}
                  {isInProgress && (
                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/20">
                      <div
                        className="h-full bg-white/75 transition-all duration-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Hover — Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </div>

                  {/* Lock overlay for tier-gated content */}
                  <LockOverlay requiredTierLevel={c.min_tier_level} userTierLevel={userTier} />
                </div>

                {/* Completed accent line */}
                {isCompleted && <div className="h-0.5 bg-[hsl(var(--success))] shrink-0" />}

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed flex-1">
                    {c.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {c.lessonCount} שיעורים
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {c.duration_label}
                    </span>

                    {/* CTA link — push to the end */}
                    <span className="mr-auto flex items-center gap-1 text-primary font-semibold group-hover:gap-1.5 transition-all">
                      {!canAccess(userTier, c.min_tier_level) ? "שדרגו" :
                       isCompleted ? "עבור שוב" : isInProgress ? "המשך" : "התחל"}
                      <ChevronLeft className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Progress bar */}
                  {isInProgress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">התקדמות</span>
                        <span className="font-bold text-primary">{c.progress}%</span>
                      </div>
                      <Progress value={c.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
