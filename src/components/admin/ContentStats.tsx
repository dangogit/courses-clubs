'use client';

import { useState } from "react";
import { Play, BookOpen, Users, Bot, Eye } from "lucide-react";
import { initialRecordings } from "@/data/recordings";
import { groups } from "@/data/groups";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import FilterableStatCard from "@/components/admin/FilterableStatCard";

const initialCourses = [
  { title: "יסודות AI", lessons: 12, students: 1200, progress: 75 },
  { title: "שליטה ב-Prompt Engineering", lessons: 8, students: 890, progress: 30 },
  { title: "בניית צ׳אטבוטים חכמים", lessons: 15, students: 650, progress: 0 },
  { title: "AI לשיווק דיגיטלי", lessons: 10, students: 430, progress: 0 },
  { title: "כלי No-Code AI", lessons: 6, students: 780, progress: 100 },
  { title: "למידת מכונה מתקדמת", lessons: 20, students: 220, progress: 0 },
];

const agents = [
  { name: "סוכן שירות לקוחות", users: 340 },
  { name: "סוכן שיווק דיגיטלי", users: 520 },
  { name: "סוכן מיילים חכם", users: 280 },
  { name: "סוכן ניתוח נתונים", users: 190 },
  { name: "סוכן מכירות", users: 150 },
  { name: "סוכן אוטומציה", users: 210 },
];

const top10AllTime = [...initialRecordings]
  .sort((a, b) => b.views - a.views)
  .slice(0, 10);

// Mock data for recent top 10 (month vs week)
const top10Month = [...initialRecordings]
  .sort((a, b) => b.views - a.views)
  .slice(0, 10)
  .map((r, i) => ({ ...r, views: Math.round(r.views * (0.3 - i * 0.015)) }));

const top10Week = [...initialRecordings]
  .sort((a, b) => b.views - a.views)
  .slice(0, 10)
  .map((r, i) => ({ ...r, views: Math.round(r.views * (0.1 - i * 0.005)) }));

const contentStats = [
  { title: "סה״כ הקלטות", value: initialRecordings.length.toString(), icon: Play, change: "+3 החודש" },
  { title: "סה״כ קורסים", value: initialCourses.length.toString(), icon: BookOpen, change: "+1 החודש" },
  { title: "סה״כ קבוצות", value: groups.length.toString(), icon: Users, change: "ללא שינוי" },
  { title: "סוכני AI", value: agents.length.toString(), icon: Bot, change: "+2 החודש" },
];

type RecentPeriod = "month" | "week";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

function RecentTop10() {
  const [recentPeriod, setRecentPeriod] = useState<RecentPeriod>("month");
  const data = recentPeriod === "month" ? top10Month : top10Week;

  return (
    <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
      className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold">10 הכי נצפים לאחרונה</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {recentPeriod === "month" ? "בחודש האחרון" : "בשבוע האחרון"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(["month", "week"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setRecentPeriod(p)}
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full transition-all",
                  recentPeriod === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                )}
              >
                {p === "month" ? "חודש" : "שבוע"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="divide-y">
        {data.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/20 transition-colors">
            <span className="text-lg font-bold text-muted-foreground/50 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.speaker}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary">
              <Eye className="h-3 w-3" />
              {r.views.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ContentStats() {
  return (
    <div className="space-y-6">
      {/* Recordings viewed stat */}
      <FilterableStatCard
        title="הקלטות נצפו"
        icon={Play}
        periodData={{
          day: { value: "156", change: "+12 מאתמול", trend: "up" },
          week: { value: "890", change: "+15% מהשבוע שעבר", trend: "up" },
          month: { value: "2,890", change: "+18% מהחודש שעבר", trend: "up" },
          year: { value: "28,450", change: "+42% מהשנה שעברה", trend: "up" },
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top 10 all time */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-display font-bold">הקלטות הכי נצפות מכל הזמנים</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top 10 לפי מספר צפיות</p>
          </div>
          <div className="divide-y">
            {top10AllTime.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/20 transition-colors">
                <span className="text-lg font-bold text-muted-foreground/50 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.speaker}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  <Eye className="h-3 w-3" />
                  {r.views.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top 10 recent (month/week toggle) */}
        <RecentTop10 />
      </div>

      {/* Courses by completion */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
        className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-display font-bold">קורסים לפי השלמה</h3>
        </div>
        <div className="divide-y">
          {initialCourses.sort((a, b) => b.progress - a.progress).map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
              </div>
              <div className="w-24 bg-secondary rounded-full h-1.5">
                <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${c.progress}%` }} />
              </div>
              <span className="text-xs font-bold w-10 text-left">{c.progress}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
