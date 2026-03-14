'use client';

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, BookOpen, Clock, CheckCircle, Play,
  Sparkles, ArrowLeft, GraduationCap, Target, Users, BarChart3, ChevronDown, ChevronUp,
  Trophy, PartyPopper, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse } from "@/hooks/useCourse";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

// --- Static "about" metadata per course order_index ---
// Will move to DB when admin CMS is built (Phase 4)
const courseAbout: Record<number, {
  level: string;
  audience: string;
  goals: string[];
  prerequisites: string;
}> = {
  0: {
    level: "מתחילים",
    audience: "כל מי שרוצה להבין AI מהיסוד",
    goals: [
      "להבין מה זה בינה מלאכותית ולמידת מכונה",
      "להכיר את הכלים המובילים בתחום",
      "לכתוב פרומפטים אפקטיביים",
      "ליישם AI בעבודה היומיומית",
    ],
    prerequisites: "אין דרישות מוקדמות – מתאים לחלוטין למתחילים",
  },
  1: {
    level: "בינוני",
    audience: "מי שמשתמש ב-ChatGPT ורוצה תוצאות טובות יותר",
    goals: [
      "לשלוט בטכניקות Prompt Engineering מתקדמות",
      "לכתוב פרומפטים לכל מקרה שימוש",
      "להימנע מטעויות נפוצות",
      "לחסוך זמן עם אוטומציה חכמה",
    ],
    prerequisites: "היכרות בסיסית עם ChatGPT או מודלי שפה",
  },
  2: {
    level: "בינוני",
    audience: "בעלי עסקים, מנהלים ויזמים",
    goals: [
      "לבנות צ׳אטבוט עסקי מאפס",
      "לחבר בוט לאתר ולוואטסאפ",
      "למדוד ולשפר ביצועים",
      "לסקייל פתרון אוטומטי",
    ],
    prerequisites: "ידע בסיסי בדיגיטל – אין צורך בתכנות",
  },
  3: {
    level: "מתחילים-בינוני",
    audience: "אנשי שיווק ובעלי עסקים",
    goals: [
      "ליצור תוכן שיווקי עם AI",
      "לאופטמז קמפיינים בזמן אמת",
      "לבנות אוטומציות שיווקיות",
      "להכפיל תפוקה ללא כוח אדם נוסף",
    ],
    prerequisites: "ניסיון בסיסי בשיווק דיגיטלי",
  },
  4: {
    level: "מתחילים",
    audience: "כל מי שרוצה לבנות פתרונות AI ללא קוד",
    goals: [
      "לבנות אוטומציות חכמות עם Zapier ו-Make",
      "לשלב AI באפליקציות No-Code",
      "לאמוד ולחסוך שעות עבודה שבועיות",
    ],
    prerequisites: "אין צורך בידע תכנות כלל",
  },
  5: {
    level: "מתקדמים",
    audience: "מפתחים ומדעני נתונים",
    goals: [
      "לשלוט באלגוריתמי ML מתקדמים",
      "לבנות ולאמן רשתות נוירונים",
      "לפרוס מודלים לפרודקשן",
      "להבין Transformers ו-RAG לעומק",
    ],
    prerequisites: "ידע בפייתון, אלגברה לינארית וסטטיסטיקה בסיסית",
  },
};

function CircularProgress({
  percent, size = 96, strokeWidth = 7,
}: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--primary-foreground) / 0.2)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-primary-foreground leading-none">{percent}%</span>
        <span className="text-[9px] text-primary-foreground/65 mt-0.5">הושלם</span>
      </div>
    </div>
  );
}

function SidebarProgress({
  percent, size = 120, strokeWidth = 8,
}: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground leading-none">{percent}%</span>
        <span className="text-xs text-muted-foreground mt-1">הושלם</span>
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: courseData, isLoading: courseLoading } = useCourse(id);
  const { completedLessonIds, isCompleted: isLessonCompleted, isLoading: progressLoading } = useLessonProgress(id);
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const hasTriggered = useRef(false);
  const prevProgressRef = useRef<number | null>(null);

  const course = courseData;
  const lessons = course?.lessons ?? [];
  const totalLessons = lessons.length;
  const lessonsCompleted = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  // Confetti + celebration dialog on 100%
  useEffect(() => {
    if (!course || progressLoading || progressPercent !== 100 || hasTriggered.current) return;
    // Only trigger if we just reached 100% (not if we loaded at 100%)
    if (prevProgressRef.current !== null && prevProgressRef.current < 100) {
      hasTriggered.current = true;
      queueMicrotask(() => setShowCelebration(true));
      const end = Date.now() + 3500;
      const frame = () => {
        confetti({ particleCount: 7, angle: 60, spread: 65, origin: { x: 0 }, colors: ["hsl(262,83%,58%)", "#fbbf24", "#34d399", "#f472b6"] });
        confetti({ particleCount: 7, angle: 120, spread: 65, origin: { x: 1 }, colors: ["hsl(262,83%,58%)", "#fbbf24", "#34d399", "#f472b6"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    prevProgressRef.current = progressPercent;
  }, [progressPercent, course, progressLoading]);

  // Track previous progress for celebration detection
  useEffect(() => {
    if (!progressLoading) {
      prevProgressRef.current = progressPercent;
    }
  }, [progressPercent, progressLoading]);

  if (courseLoading || progressLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">הקורס לא נמצא</p>
        <Button variant="link" onClick={() => router.push("/courses")}>חזרה לקורסים</Button>
      </div>
    );
  }

  const nextLesson = lessons.find((l) => !completedLessonIds.has(l.id));
  const ctaLabel = lessonsCompleted === 0 ? "התחילו ללמוד" : "המשיכו ללמוד";
  const about = courseAbout[course.order_index] ?? courseAbout[0];
  const COLLAPSED_COUNT = 6;
  const visibleLessons = showAllLessons ? lessons : lessons.slice(0, COLLAPSED_COUNT);
  const hasMore = totalLessons > COLLAPSED_COUNT;

  return (
    <div className="max-w-7xl mx-auto px-0 lg:px-2" dir="rtl">

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-sm text-center border-0 bg-card shadow-2xl rounded-3xl p-8" dir="rtl">
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Trophy className="h-10 w-10 text-primary" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">כל הכבוד! 🏆</h2>
                  <p className="text-muted-foreground text-sm">
                    סיימתם את הקורס <span className="font-semibold text-foreground">&ldquo;{course.title}&rdquo;</span> בהצלחה!
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                    >
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button className="w-full gap-2" onClick={() => { setShowCelebration(false); router.push("/courses"); }}>
                    <PartyPopper className="h-4 w-4" />
                    לקורסים נוספים
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCelebration(false)}>
                    סגור
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-5">
        <Link href="/courses" className="hover:text-primary transition-colors">מרכז הלמידה</Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        <span className="text-foreground font-medium truncate max-w-[260px]">{course.title}</span>
      </nav>

      {/* Desktop two-column */}
      <div className="flex flex-col lg:flex-row gap-7">

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* HERO BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gradient-hero rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsla(0,0%,100%,0.08),transparent_55%)]" />
            <div className="relative flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  {course.tag && (
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px] font-bold backdrop-blur-sm">
                      {course.tag}
                    </Badge>
                  )}
                  <Badge className="bg-primary-foreground/10 text-primary-foreground/80 border-0 text-[10px] backdrop-blur-sm">
                    {about.level}
                  </Badge>
                </div>
                <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2 leading-tight">{course.title}</h1>
                <p className="text-primary-foreground/75 text-sm lg:text-base mb-5 leading-relaxed max-w-xl">{course.description}</p>
                <div className="flex flex-wrap items-center gap-5 text-xs text-primary-foreground/65">
                  <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {totalLessons} שיעורים</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {course.duration_label}</span>
                  <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> {about.level}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {about.audience}</span>
                </div>
              </div>
              <div className="shrink-0 hidden sm:block">
                <CircularProgress percent={progressPercent} size={96} />
              </div>
            </div>
          </motion.div>

          {/* ABOUT SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 lg:p-6"
          >
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              אודות הקורס
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Goals */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> מה תלמדו
                </p>
                <ul className="space-y-2">
                  {about.goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> למי מיועד
                  </p>
                  <p className="text-sm">{about.audience}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> דרישות מוקדמות
                  </p>
                  <p className="text-sm text-muted-foreground">{about.prerequisites}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-primary">{totalLessons}</p>
                    <p className="text-[11px] text-muted-foreground">שיעורים</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-primary">{course.duration_label}</p>
                    <p className="text-[11px] text-muted-foreground">משך הקורס</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA bar — mobile only */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:hidden flex items-center justify-between bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4"
          >
            <div>
              <span className="text-sm font-bold">{lessonsCompleted}/{totalLessons} שיעורים הושלמו</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {progressPercent === 0 && "בואו נתחיל! 🚀"}
                {progressPercent > 0 && progressPercent < 50 && "התחלה מצוינת! 💪"}
                {progressPercent >= 50 && progressPercent < 100 && "כמעט שם! 🔥"}
                {progressPercent === 100 && "מדהים! סיימתם! 🏆"}
              </p>
            </div>
            {nextLesson && (
              <Button size="sm" onClick={() => router.push(`/courses/${id}/lesson/${nextLesson.id}`)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                {ctaLabel}
              </Button>
            )}
          </motion.div>

          {/* LESSON LIST */}
          <div>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              תוכן הקורס
              <span className="text-xs font-normal text-muted-foreground">({totalLessons} שיעורים)</span>
            </h2>

            <div className="space-y-2">
              {visibleLessons.map((lesson, i) => {
                const completed = isLessonCompleted(lesson.id);
                const isNext = nextLesson?.id === lesson.id;
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.22 + i * 0.03 }}
                    onClick={() => router.push(`/courses/${id}/lesson/${lesson.id}`)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 group hover:shadow-md ${
                      completed
                        ? "bg-accent/40 border-primary/20 hover:border-primary/35"
                        : isNext
                        ? "bg-primary/5 border-primary/30 hover:border-primary/50 hover:bg-primary/8"
                        : "bg-card/80 border-border/50 hover:border-primary/20 hover:bg-card"
                    }`}
                  >
                    {/* Circle */}
                    <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      completed
                        ? "bg-primary border-primary"
                        : isNext
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 bg-background group-hover:border-primary/40"
                    }`}>
                      {completed
                        ? <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        : isNext
                        ? <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                        : <span className="text-[10px] font-bold text-muted-foreground">{lesson.order_index + 1}</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${completed ? "text-primary" : isNext ? "font-semibold" : ""}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lesson.description}</p>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{lesson.duration_label}
                      </span>
                      {isNext && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          הבא
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Show more / less toggle */}
            {hasMore && (
              <button
                onClick={() => setShowAllLessons(!showAllLessons)}
                className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-2.5 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                {showAllLessons
                  ? <><ChevronUp className="h-4 w-4" /> הצג פחות</>
                  : <><ChevronDown className="h-4 w-4" /> הצג את כל {totalLessons} השיעורים</>
                }
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR — desktop only ── */}
        <div className="hidden lg:flex flex-col gap-5 w-80 shrink-0">

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 sticky top-6"
          >
            {/* Big progress ring */}
            <div className="flex justify-center mb-5">
              <SidebarProgress percent={progressPercent} size={120} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{lessonsCompleted}</p>
                <p className="text-[11px] text-muted-foreground">שיעורים הושלמו</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{totalLessons - lessonsCompleted}</p>
                <p className="text-[11px] text-muted-foreground">שיעורים נותרו</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>התקדמות</span>
                <span>{lessonsCompleted}/{totalLessons}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground my-4">
              {progressPercent === 0 && "בואו נתחיל! 🚀"}
              {progressPercent > 0 && progressPercent < 50 && "התחלה מצוינת! 💪"}
              {progressPercent >= 50 && progressPercent < 100 && "כמעט שם! 🔥"}
              {progressPercent === 100 && "מדהים! סיימתם! 🏆"}
            </p>

            {nextLesson ? (
              <Button
                className="w-full gap-2"
                onClick={() => router.push(`/courses/${id}/lesson/${nextLesson.id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
                {ctaLabel}
              </Button>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/courses")}>
                לקורסים נוספים
              </Button>
            )}

          </motion.div>
        </div>

      </div>
    </div>
  );
}
