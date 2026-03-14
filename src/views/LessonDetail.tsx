'use client';

import { useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Clock, Play,
  CheckCircle2, BookOpen,
  Bookmark, Share2, ExternalLink, List, Maximize2, Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse } from "@/hooks/useCourse";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import confetti from "canvas-confetti";
import CommentsSection, { type Comment } from "@/components/CommentsSection";

const mockComments: Comment[] = [
  { id: 1, author: "אורן לוי", avatar: "oren", text: "שיעור מעולה! ממליץ בחום", date: "לפני יומיים", likes: 8, replies: [] },
  { id: 2, author: "רונית שמש", avatar: "ronit", text: "מתי יוצא החלק הבא?", date: "לפני 4 ימים", likes: 3, replies: [] },
];

function LessonDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-[56vw] max-h-[500px] w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export default function LessonDetail() {
  const { id, lessonId } = useParams() as { id: string; lessonId: string };
  const router = useRouter();
  const { data: courseData, isLoading: courseLoading } = useCourse(id);
  const { completedLessonIds, isCompleted, toggleProgress, isToggling, isLoading: progressLoading } = useLessonProgress(id);

  const course = courseData;
  const lessons = useMemo(() => course?.lessons ?? [], [course]);
  const lesson = useMemo(() => lessons.find((l) => l.id === lessonId), [lessons, lessonId]);
  const lessonIndex = useMemo(() => lessons.findIndex((l) => l.id === lessonId), [lessons, lessonId]);

  const watched = lesson ? isCompleted(lesson.id) : false;

  const handleToggleWatched = useCallback(() => {
    if (!lesson) return;
    toggleProgress(lesson.id);
    if (!watched) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ["#22c55e", "#10b981", "#34d399", "#6ee7b7"] });
    }
  }, [lesson, toggleProgress, watched]);

  const totalLessons = lessons.length;
  const watchedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;

  const [bookmarked, setBookmarked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);

  if (courseLoading || progressLoading) {
    return <LessonDetailSkeleton />;
  }

  if (!course || !lesson) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">השיעור לא נמצא</p>
        <Button variant="link" onClick={() => router.push("/courses")}>חזרה לקורסים</Button>
      </div>
    );
  }

  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < totalLessons - 1 ? lessons[lessonIndex + 1] : null;

  return (
    <div className={theaterMode ? "w-full" : "flex flex-row-reverse gap-6 max-w-6xl mx-auto"}>
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Link href="/courses" className="hover:text-primary transition-colors font-medium">מרכז הלמידה</Link>
          <ChevronRight className="h-3 w-3 rotate-180 shrink-0" />
          <Link href={`/courses/${id}`} className="hover:text-primary transition-colors font-medium truncate max-w-[150px]">{course.title}</Link>
          <ChevronRight className="h-3 w-3 rotate-180 shrink-0" />
          <span className="text-foreground font-semibold truncate max-w-[200px]">{lesson.title}</span>
        </nav>

        {/* Title & meta */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[10px] rounded-lg">
              שיעור {lessonIndex + 1} מתוך {totalLessons}
            </Badge>
            {watched && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="h-3 w-3 ml-1" /> נצפה
              </Badge>
            )}
          </div>
          <h1 className="font-display text-xl md:text-2xl font-bold leading-tight mb-2">{lesson.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.duration_label}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.title}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className={theaterMode ? "bg-black/90 -mx-3 sm:-mx-4 px-0 mb-4" : ""}>
        <div className={`w-full aspect-video ${theaterMode ? "rounded-none" : "rounded-2xl mb-4"} gradient-hero relative flex items-center justify-center overflow-hidden group cursor-pointer shadow-lg`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,hsla(0,0%,100%,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300 shadow-2xl">
            <Play className="h-9 w-9 text-white mr-[-3px]" />
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {lesson.duration_label}
            </span>
          </div>
          <div className="absolute bottom-4 right-4">
            <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
              <Play className="h-3 w-3 fill-current" /> לחצו לצפייה
            </span>
          </div>
        </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-5">
          {/* Watched toggle */}
          <button
            onClick={handleToggleWatched}
            disabled={isToggling}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
              watched
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
            } ${isToggling ? "opacity-70" : ""}`}
          >
            {watched ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
            {watched ? "נצפה" : "סיימתי לצפות"}
          </button>

          <div className="flex items-center gap-1 mr-auto">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                bookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheaterMode(t => !t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                theaterMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              title={theaterMode ? "יציאה ממצב תיאטרון" : "מצב תיאטרון"}
            >
              {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Prev/Next */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!prevLesson}
              onClick={() => prevLesson && router.push(`/courses/${id}/lesson/${prevLesson.id}`)}
              className="text-xs gap-1 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              הקודם
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!nextLesson}
              onClick={() => nextLesson && router.push(`/courses/${id}/lesson/${nextLesson.id}`)}
              className="text-xs gap-1 cursor-pointer"
            >
              הבא
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Watched confirmation */}
        {watched && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              סיימת שיעור זה · {watchedCount}/{totalLessons} הושלמו
              {nextLesson && (
                <button
                  onClick={() => router.push(`/courses/${id}/lesson/${nextLesson.id}`)}
                  className="mr-2 text-primary hover:underline font-semibold cursor-pointer"
                >
                  המשך לשיעור הבא →
                </button>
              )}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 mb-5">
          <h2 className="font-bold text-sm mb-3">על השיעור</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong>{lesson.description}</strong>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            שיעור מקיף שמכסה {lesson.title}. השיעור כולל דוגמאות מעשיות, תרגילים והסברים מפורטים.
          </p>
          <p className="text-sm font-semibold mb-2">מה תלמדו:</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {["הסבר תיאורטי של הנושא", "הדגמה מעשית", "תרגיל ליישום עצמי", "סיכום וטיפים"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold mt-px">+</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Links */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            חומרי לימוד
          </h3>
          <ul className="space-y-2.5">
            {["מצגת השיעור", "קובץ תרגילים", "קישורים לכלים שהוזכרו"].map((link, i) => (
              <li key={i}>
                <a href="#" className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Separator className="mb-6" />

        <CommentsSection
          storageKey={`lesson-${id}-${lessonId}`}
          initialComments={mockComments}
          contextLabel="שיעור"
          contextTitle={lesson.title}
        />
      </div>

      {/* Lessons Sidebar */}
      <aside className={`${theaterMode ? "hidden" : "hidden lg:block"} shrink-0 sticky top-[5rem] h-[calc(100vh-6rem)] transition-all duration-300 ${sidebarOpen ? "w-72" : "w-10"}`}>
        {sidebarOpen ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  תוכן הקורס
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="הסתר רשימה"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{watchedCount}/{totalLessons}</span>
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="font-bold text-primary">{progressPercent}%</span>
              </div>
            </div>

            {/* Lessons list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              <div className="space-y-0.5">
                {lessons.map((l) => {
                  const isActive = l.id === lessonId;
                  const isLessonDone = isCompleted(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => router.push(`/courses/${id}/lesson/${l.id}`)}
                      className={`w-full text-right flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : isLessonDone
                          ? "bg-emerald-500/10 text-foreground hover:bg-emerald-500/15"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {/* Number/check */}
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : isLessonDone
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {isLessonDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : l.order_index + 1}
                      </div>

                      {/* Title + duration */}
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium leading-tight`}>{l.title}</p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {l.duration_label}
                        </p>
                      </div>

                      {/* Playing indicator */}
                      {isActive && (
                        <div className="shrink-0">
                          <Play className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Back to course */}
            <div className="p-3 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1.5 cursor-pointer"
                onClick={() => router.push(`/courses/${id}`)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                חזרה לדף הקורס
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-2 hover:bg-secondary transition-all cursor-pointer"
            title="הצג רשימת שיעורים"
          >
            <List className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </aside>
    </div>
  );
}
